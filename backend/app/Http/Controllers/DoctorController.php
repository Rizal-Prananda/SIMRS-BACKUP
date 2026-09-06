<?php

namespace App\Http\Controllers;

use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DoctorController extends Controller
{
    private const PER_PAGE_OPTIONS = [10, 25, 50, 100];

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer'],
            'sort' => ['nullable', 'in:name,code'],
            'direction' => ['nullable', 'in:asc,desc'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 10);
        if (! in_array($perPage, self::PER_PAGE_OPTIONS, true)) {
            $perPage = 10;
        }

        $query = DB::table('person as p')
            ->leftJoin('emp as e', 'e.pid', '=', 'p.pid')
            ->where('p.is_doctor', true)
            ->select([
                'p.pid', 'p.name_real', 'p.name_family', 'p.is_del', 'p.is_visible', 'p.ihs_nakes',
                'e.empid', 'e.short_id', 'e.nomor_dokter', 'e.ir_code', 'e.kd_dpjp', 'e.is_discharged',
            ]);

        $this->applySearch($query, trim((string) ($validated['search'] ?? '')));
        $sortColumn = ($validated['sort'] ?? 'name') === 'code' ? 'p.pid' : 'p.name_real';
        $direction = $validated['direction'] ?? 'asc';
        $paginator = $query->orderBy($sortColumn, $direction)->paginate($perPage);

        $items = collect($paginator->items());
        $departmentsByEmployee = $this->departmentsByEmployee($items->pluck('empid')->filter()->all());
        $schedulePlacesByDoctor = $this->schedulePlacesByDoctor($items->pluck('pid')->all());

        $rows = $items->map(function (object $doctor) use ($departmentsByEmployee, $schedulePlacesByDoctor): array {
            $departments = $departmentsByEmployee->get((string) $doctor->empid, collect());
            $places = $schedulePlacesByDoctor->get((string) $doctor->pid, collect());

            return [
                'pid' => (int) $doctor->pid,
                'doctor_code' => (string) $doctor->pid,
                'name' => $this->fullName($doctor),
                'departments' => $departments->map(fn (object $department): array => $this->departmentProjection($department))->values(),
                'is_specialist' => $this->booleanLabel($departments->contains(fn (object $department): bool => (bool) $department->is_spesialis)),
                'prefix_code' => $this->value($doctor->short_id),
                'building' => $this->joinUnique($departments->pluck('dept_location')->all()),
                'floor' => $this->joinUnique($places->pluck('daily_floor')->all()),
                'room' => $this->joinUnique($places->pluck('daily_room')->all()),
                'bpjs_id' => $this->identifier($doctor->kd_dpjp),
                'inhealth_id' => $this->value($doctor->ir_code),
                'ihs_id' => $this->value($doctor->ihs_nakes),
                'attendance_status' => '-',
                'is_active' => ! (bool) $doctor->is_discharged && ! (bool) $doctor->is_del,
            ];
        })->values();

        return response()->json([
            'data' => $rows,
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

    public function show(int $pid): JsonResponse
    {
        $doctor = DB::table('person as p')
            ->leftJoin('emp as e', 'e.pid', '=', 'p.pid')
            ->where('p.pid', $pid)
            ->where('p.is_doctor', true)
            ->first([
                'p.pid', 'p.name_real', 'p.name_family', 'p.date_birth', 'p.sex', 'p.birth_place',
                'p.religion', 'p.civil_status', 'p.mobile_nr', 'p.ph_nr', 'p.email',
                'p.addr_str', 'p.kelurahan', 'p.kecamatan', 'p.kabupaten', 'p.addr_city',
                'p.addr_province', 'p.addr_zip', 'p.ihs_nakes', 'p.is_del', 'p.is_visible',
                'e.empid', 'e.short_id', 'e.nomor_dokter', 'e.sip', 'e.kd_dpjp',
                'e.is_discharged', 'e.job_function_title', 'e.workingstatus', 'e.date_join', 'e.date_exit',
            ]);

        abort_if(! $doctor, 404, 'Data dokter tidak ditemukan.');

        $departments = $doctor->empid
            ? $this->departmentsByEmployee([(int) $doctor->empid])->get((string) $doctor->empid, collect())
            : collect();

        return response()->json(['data' => [
            'doctor_code' => (string) $doctor->pid,
            'is_active' => ! (bool) $doctor->is_discharged && ! (bool) $doctor->is_del,
            'identity' => [
                'pid' => (int) $doctor->pid,
                'name' => $this->fullName($doctor),
                'sex' => $this->sexLabel($doctor->sex),
                'birth_place' => $this->value($doctor->birth_place),
                'date_of_birth' => $this->displayDate($doctor->date_birth),
                'religion' => $this->value($doctor->religion),
                'marital_status' => $this->value($doctor->civil_status),
                'phone' => $this->firstValue($doctor->mobile_nr, $doctor->ph_nr),
                'email' => $this->value($doctor->email),
                'address' => $this->joinUnique([$doctor->addr_str, $doctor->kelurahan, $doctor->kecamatan, $doctor->kabupaten, $doctor->addr_city, $doctor->addr_province, $doctor->addr_zip]),
                'ihs_id' => $this->value($doctor->ihs_nakes),
            ],
            'employee' => [
                'empid' => $this->identifier($doctor->empid),
                'doctor_number' => $this->value($doctor->nomor_dokter),
                'sip' => $this->value($doctor->sip),
                'kd_dpjp' => $this->identifier($doctor->kd_dpjp),
                'prefix_code' => $this->value($doctor->short_id),
                'job_title' => $this->value($doctor->job_function_title),
                'working_status' => $this->value($doctor->workingstatus),
                'is_discharged' => $this->booleanLabel($doctor->is_discharged),
                'join_date' => $this->displayDate($doctor->date_join),
                'exit_date' => $this->displayDate($doctor->date_exit),
            ],
            'departments' => $departments->map(fn (object $department): array => $this->departmentProjection($department))->values(),
        ]]);
    }

    public function departments(int $pid): JsonResponse
    {
        $doctor = DB::table('person as p')->leftJoin('emp as e', 'e.pid', '=', 'p.pid')
            ->where('p.pid', $pid)->where('p.is_doctor', true)->first(['p.pid', 'e.empid']);
        abort_if(! $doctor, 404, 'Data dokter tidak ditemukan.');

        $rows = $doctor->empid
            ? $this->departmentsByEmployee([(int) $doctor->empid])->get((string) $doctor->empid, collect())
                ->map(fn (object $department): array => $this->departmentProjection($department))->values()
            : collect();

        return response()->json(['data' => $rows]);
    }

    public function schedules(int $pid): JsonResponse
    {
        abort_if(! DB::table('person')->where('pid', $pid)->where('is_doctor', true)->exists(), 404, 'Data dokter tidak ditemukan.');

        $rows = DB::table('doctor_schedule as ds')
            ->join('department as d', 'd.did', '=', 'ds.did')
            ->where('ds.pid', $pid)
            ->select([
                'ds.dsid', 'ds.did', 'ds.weekday', 'ds.start_hour', 'ds.start_minute',
                'ds.end_hour', 'ds.end_minute', 'ds.daily_room', 'ds.daily_floor',
                'ds.is_bpjs', 'ds.kuota_hfis', 'd.name_formal', 'd.name_short',
            ])
            ->orderBy('ds.weekday')->orderBy('ds.start_hour')->orderBy('ds.start_minute')->get()
            ->map(fn (object $schedule): array => [
                'dsid' => (int) $schedule->dsid,
                'did' => (int) $schedule->did,
                'weekday' => (int) $schedule->weekday,
                'day' => $this->weekdayLabel((int) $schedule->weekday),
                'start_time' => $this->time((int) $schedule->start_hour, (int) $schedule->start_minute),
                'end_time' => $this->time((int) $schedule->end_hour, (int) $schedule->end_minute),
                'department' => $this->firstValue($schedule->name_formal, $schedule->name_short),
                'floor' => $this->value($schedule->daily_floor),
                'room' => $this->value($schedule->daily_room),
                'bpjs' => $this->booleanLabel($schedule->is_bpjs),
                'hfis_quota' => $this->identifier($schedule->kuota_hfis),
            ])->values();

        return response()->json(['data' => $rows]);
    }

    private function applySearch(Builder $query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $nameSearch = '%'.mb_strtolower($search).'%';
        $query->where(function (Builder $nested) use ($nameSearch, $search): void {
            $nested->whereRaw("LOWER(COALESCE(p.name_real, '') || ' ' || COALESCE(p.name_family, '')) LIKE ?", [$nameSearch]);
            if (preg_match('/^-?\d+$/', $search) === 1) {
                $nested->orWhere('p.pid', (int) $search);
            }
        });
    }

    private function departmentsByEmployee(array $employeeIds): Collection
    {
        if ($employeeIds === []) {
            return collect();
        }

        return DB::table('doctor_dept as dd')
            ->join('department as d', 'd.did', '=', 'dd.did')
            ->whereIn('dd.empid', $employeeIds)
            ->select(['dd.ddid', 'dd.empid', 'd.did', 'd.dept_code', 'd.name_short', 'd.name_formal', 'd.dept_location', 'd.is_spesialis', 'd.is_inactive', 'd.is_del', 'd.bpjs_dept_code', 'd.ihs_location'])
            ->orderBy('d.name_formal')
            ->get()
            ->groupBy(fn (object $row): string => (string) $row->empid);
    }

    private function schedulePlacesByDoctor(array $pids): Collection
    {
        if ($pids === []) {
            return collect();
        }

        return DB::table('doctor_schedule')->whereIn('pid', $pids)
            ->select(['pid', 'daily_floor', 'daily_room'])->get()
            ->groupBy(fn (object $row): string => (string) $row->pid);
    }

    private function departmentProjection(object $department): array
    {
        return [
            'did' => (int) $department->did,
            'name' => $this->firstValue($department->name_formal, $department->name_short),
            'code' => $this->value($department->dept_code),
            'location' => $this->value($department->dept_location),
            'is_specialist' => $this->booleanLabel($department->is_spesialis),
            'is_active' => ! (bool) $department->is_inactive && ! (bool) $department->is_del,
            'bpjs_code' => $this->value($department->bpjs_dept_code),
            'ihs_location' => $this->value($department->ihs_location),
        ];
    }

    private function fullName(object $person): string
    {
        return $this->value(trim(implode(' ', array_filter([$person->name_real, $person->name_family]))));
    }

    private function sexLabel(mixed $sex): string
    {
        return match (strtolower(trim((string) $sex))) {
            'm', 'l', 'male', 'laki-laki' => 'Laki-laki',
            'f', 'p', 'female', 'perempuan' => 'Perempuan',
            default => $this->value($sex),
        };
    }

    private function displayDate(mixed $date): string
    {
        return $date ? Carbon::parse($date)->format('d-m-Y') : '-';
    }

    private function weekdayLabel(int $weekday): string
    {
        return [0 => 'Minggu', 1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu'][$weekday] ?? 'Hari '.$weekday;
    }

    private function time(int $hour, int $minute): string
    {
        return sprintf('%02d:%02d', $hour, $minute);
    }

    private function booleanLabel(mixed $value): string
    {
        return $value === null ? '-' : ((bool) $value ? 'Ya' : 'Tidak');
    }

    private function identifier(mixed $value): string
    {
        return $value === null || trim((string) $value) === '' || (string) $value === '0' ? '-' : trim((string) $value);
    }

    private function value(mixed $value): string
    {
        $clean = trim((string) ($value ?? ''));

        return $clean === '' ? '-' : $clean;
    }

    private function firstValue(mixed ...$values): string
    {
        foreach ($values as $value) {
            if ($this->value($value) !== '-') {
                return $this->value($value);
            }
        }

        return '-';
    }

    private function joinUnique(array $values): string
    {
        $clean = array_values(array_unique(array_filter(array_map(fn (mixed $value): string => trim((string) ($value ?? '')), $values))));

        return $clean === [] ? '-' : implode(', ', $clean);
    }
}
