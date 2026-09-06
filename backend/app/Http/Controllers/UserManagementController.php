<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::in(['Administrator', 'Dokter', 'Perawat', 'Petugas'])],
            'status' => ['nullable', Rule::in(['Aktif', 'Nonaktif'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = $this->userQuery();
        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $needle = '%'.strtolower($search).'%';
            $query->where(function (Builder $nested) use ($needle): void {
                $nested->whereRaw('LOWER(users.login_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(COALESCE(person.name_real, ?)) LIKE ?', ['', $needle])
                    ->orWhereRaw('LOWER(COALESCE(person.name_family, ?)) LIKE ?', ['', $needle]);
            });
        }

        if (isset($filters['role'])) {
            $this->applyRoleFilter($query, $filters['role']);
        }
        if (isset($filters['status'])) {
            $this->applyStatusFilter($query, $filters['status']);
        }

        $paginator = $query
            ->orderByRaw('LOWER(users.login_name)')
            ->paginate((int) ($filters['per_page'] ?? 8));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (object $row): array => $this->serializeUser($row))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    public function show(int $loginId): JsonResponse
    {
        $row = $this->userQuery()->where('users.login_id', $loginId)->first();
        abort_if(! $row, 404);

        return response()->json(['data' => $this->serializeUser($row)]);
    }

    private function userQuery(): Builder
    {
        $lastAccess = DB::table('web_access_logs')
            ->select('login_id')
            ->selectRaw('MAX(create_date) AS last_login')
            ->groupBy('login_id');

        return DB::table('web_users as users')
            ->leftJoin('person as person', 'person.pid', '=', 'users.pid')
            ->leftJoinSub($lastAccess, 'access_logs', 'access_logs.login_id', '=', 'users.login_id')
            ->select([
                'users.login_id',
                'users.pid',
                'users.login_name',
                'users.is_admin',
                'users.is_lock',
                'users.is_del',
                'users.lockflag',
                'users.create_time',
                'users.lastvisit_date',
                'users.last_action',
                'person.name_real',
                'person.name_family',
                'person.is_doctor',
                'person.is_nurse',
                'access_logs.last_login',
            ]);
    }

    private function applyRoleFilter(Builder $query, string $role): void
    {
        if ($role === 'Administrator') {
            $query->where('users.is_admin', true);
            return;
        }

        $this->whereFalseOrNull($query, 'users.is_admin');
        if ($role === 'Dokter') {
            $query->where('person.is_doctor', true);
            return;
        }

        $this->whereFalseOrNull($query, 'person.is_doctor');
        if ($role === 'Perawat') {
            $query->where('person.is_nurse', true);
            return;
        }

        $this->whereFalseOrNull($query, 'person.is_nurse');
    }

    private function applyStatusFilter(Builder $query, string $status): void
    {
        if ($status === 'Aktif') {
            $this->whereFalseOrNull($query, 'users.is_del');
            $this->whereFalseOrNull($query, 'users.is_lock');
            $query->where(function (Builder $nested): void {
                $nested->whereNull('users.lockflag')->orWhere('users.lockflag', 0);
            });
            return;
        }

        $query->where(function (Builder $nested): void {
            $nested->where('users.is_del', true)
                ->orWhere('users.is_lock', true)
                ->orWhere('users.lockflag', '<>', 0);
        });
    }

    private function whereFalseOrNull(Builder $query, string $column): void
    {
        $query->where(function (Builder $nested) use ($column): void {
            $nested->where($column, false)->orWhereNull($column);
        });
    }

    private function serializeUser(object $row): array
    {
        $fullName = trim(implode(' ', array_filter([
            trim((string) ($row->name_real ?? '')),
            trim((string) ($row->name_family ?? '')),
        ])));
        $username = (string) $row->login_name;
        $lastLogin = $row->last_login ?? $row->lastvisit_date ?? $row->last_action;

        return [
            'id' => (int) $row->login_id,
            'pid' => (int) $row->pid,
            'username' => $username,
            'full_name' => $fullName !== '' ? $fullName : $username,
            'initials' => $this->initials($username),
            'role' => $this->role($row),
            'status' => $this->isActive($row) ? 'Aktif' : 'Nonaktif',
            'last_login' => $this->displayDateTime($lastLogin),
            'created_at' => $this->displayDateTime($row->create_time),
        ];
    }

    private function role(object $row): string
    {
        if ((bool) $row->is_admin) return 'Administrator';
        if ((bool) $row->is_doctor) return 'Dokter';
        if ((bool) $row->is_nurse) return 'Perawat';
        return 'Petugas';
    }

    private function isActive(object $row): bool
    {
        return ! (bool) $row->is_del && ! (bool) $row->is_lock && (int) ($row->lockflag ?? 0) === 0;
    }

    private function initials(string $username): string
    {
        $parts = array_values(array_filter(preg_split('/[\s._-]+/', trim($username)) ?: []));
        if (count($parts) > 1) return strtoupper($parts[0][0].$parts[count($parts) - 1][0]);
        return strtoupper(substr($parts[0] ?? 'U', 0, 2));
    }

    private function displayDateTime(mixed $value): string
    {
        if (! $value) return '-';
        return Carbon::parse((string) $value)->format('d M Y, H:i');
    }
}
