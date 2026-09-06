<?php

namespace App\Http\Controllers;

use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DepartmentController extends Controller
{
    private const LIMIT_OPTIONS = [10, 25, 50, 100];

    private const SORT_COLUMNS = [
        'code' => 'dept_code',
        'name' => 'name_formal',
        'short_name' => 'name_short',
        'specialist' => 'is_spesialis',
        'active' => 'is_inactive',
        'deleted' => 'is_del',
        'location' => 'dept_location',
    ];

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer'],
            'sort' => ['nullable', 'in:code,name,short_name,specialist,active,deleted,location'],
            'direction' => ['nullable', 'in:asc,desc'],
        ]);

        $limit = (int) ($validated['limit'] ?? 10);
        if (! in_array($limit, self::LIMIT_OPTIONS, true)) {
            $limit = 10;
        }

        $query = DB::table('department')->select([
            'did', 'dept_code', 'name_short', 'name_formal', 'dept_location',
            'spesialist_id', 'is_spesialis', 'is_inactive', 'is_del',
        ]);
        $this->applySearch($query, trim((string) ($validated['search'] ?? '')));

        $sort = self::SORT_COLUMNS[$validated['sort'] ?? 'code'];
        $direction = $validated['direction'] ?? 'asc';
        $paginator = $query->orderBy($sort, $direction)->orderBy('did')->paginate($limit);

        $rows = collect($paginator->items())->map(fn (object $department): array => [
            'did' => (int) $department->did,
            'code' => $this->value($department->dept_code),
            'name' => $this->value($department->name_formal),
            'short_name' => $this->value($department->name_short),
            'location' => $this->value($department->dept_location),
            'specialist_id' => $this->identifier($department->spesialist_id),
            'is_specialist' => $this->booleanLabel($department->is_spesialis),
            'active_status' => $department->is_inactive === null ? '-' : ((bool) $department->is_inactive ? 'Nonaktif' : 'Aktif'),
            'delete_status' => $department->is_del === null ? '-' : ((bool) $department->is_del ? 'Deleted' : 'Normal'),
        ])->values();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    private function applySearch(Builder $query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $needle = '%'.mb_strtolower($search).'%';
        $query->where(function (Builder $nested) use ($needle): void {
            $nested->whereRaw("LOWER(COALESCE(dept_code, '')) LIKE ?", [$needle])
                ->orWhereRaw("LOWER(COALESCE(name_short, '')) LIKE ?", [$needle])
                ->orWhereRaw("LOWER(COALESCE(name_formal, '')) LIKE ?", [$needle]);
        });
    }

    private function booleanLabel(mixed $value): string
    {
        return $value === null ? '-' : ((bool) $value ? 'Ya' : 'Tidak');
    }

    private function identifier(mixed $value): string
    {
        return $value === null || trim((string) $value) === '' ? '-' : trim((string) $value);
    }

    private function value(mixed $value): string
    {
        $clean = trim((string) ($value ?? ''));

        return $clean === '' ? '-' : $clean;
    }
}
