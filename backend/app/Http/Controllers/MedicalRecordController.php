<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MedicalRecordController extends Controller
{
    private const PER_PAGE_OPTIONS = [10, 25, 50, 100];

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 10);
        if (! in_array($perPage, self::PER_PAGE_OPTIONS, true)) {
            $perPage = 10;
        }

        $query = DB::table('person')->where('pid', '>', 0)->select([
            'pid', 'name_real', 'name_family', 'date_birth', 'sex', 'birth_place',
            'mobile_nr', 'ph_nr', 'addr_str', 'kelurahan', 'kecamatan',
            'kabupaten', 'addr_city', 'addr_province', 'addr_zip',
        ]);

        $this->applySearch($query, trim((string) ($validated['search'] ?? '')));

        $paginator = $query->orderBy('pid')->paginate($perPage);
        $rows = collect($paginator->items())->map(fn (object $person): array => [
            'pid' => (int) $person->pid,
            'medical_record_number' => $this->formatMedicalRecordNumber($person->pid),
            'name' => $this->fullName($person),
            'date_of_birth' => $this->displayDate($person->date_birth),
            'sex' => $this->sexLabel($person->sex),
            'birth_place' => $this->value($person->birth_place),
            'phone' => $this->firstValue($person->mobile_nr, $person->ph_nr),
            'address' => $this->address($person),
        ])->values();

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
        abort_if($pid <= 0, 404, 'Data pasien tidak ditemukan.');

        $person = DB::table('person')->where('pid', '>', 0)->where('pid', $pid)->first([
            'pid', 'name_real', 'name_family', 'date_birth', 'sex', 'birth_place',
            'civil_status', 'religion', 'citizenship', 'mobile_nr', 'ph_nr',
            'email', 'addr_str', 'kelurahan', 'kecamatan', 'kabupaten', 'addr_city',
            'addr_province', 'addr_zip', 'contact_person', 'contact_relation',
            'contact_mobile_nr', 'contact_ph_nr', 'contact_addr', 'contact_kelurahan',
            'contact_kecamatan', 'contact_kabupaten', 'contact_city', 'contact_province',
            'contact_zip', 'blood_group', 'job', 'last_education', 'nat_id_nr',
            'other_id', 'other_id_nr', 'is_dead', 'is_blacklist', 'is_emp',
        ]);

        abort_if(! $person, 404, 'Data pasien tidak ditemukan.');

        return response()->json(['data' => [
            'medical_record_number' => $this->formatMedicalRecordNumber($person->pid),
            'identity' => [
                'pid' => (int) $person->pid,
                'name' => $this->fullName($person),
                'birth_place' => $this->value($person->birth_place),
                'date_of_birth' => $this->displayDate($person->date_birth),
                'age' => $this->age($person->date_birth),
                'sex' => $this->sexLabel($person->sex),
                'marital_status' => $this->value($person->civil_status),
                'religion' => $this->value($person->religion),
                'citizenship' => $this->value($person->citizenship),
            ],
            'contact' => [
                'phone' => $this->firstValue($person->mobile_nr, $person->ph_nr),
                'email' => $this->value($person->email),
                'address' => $this->address($person),
            ],
            'guardian' => [
                'name' => $this->value($person->contact_person),
                'relationship' => $this->value($person->contact_relation),
                'phone' => $this->firstValue($person->contact_mobile_nr, $person->contact_ph_nr),
                'address' => $this->contactAddress($person),
            ],
            'additional' => [
                'blood_group' => $this->value($person->blood_group),
                'occupation' => $this->value($person->job),
                'education' => $this->value($person->last_education),
                'national_id' => $this->value($person->nat_id_nr),
                'other_id_type' => $this->value($person->other_id),
                'other_id_number' => $this->value($person->other_id_nr),
                'is_employee' => $this->booleanLabel($person->is_emp),
                'is_dead' => $this->booleanLabel($person->is_dead),
                'is_blacklist' => $this->booleanLabel($person->is_blacklist),
            ],
        ]]);
    }

    public function visits(Request $request, int $pid): JsonResponse
    {
        abort_if($pid <= 0, 404, 'Data pasien tidak ditemukan.');

        $validated = $request->validate([
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);
        $patient = DB::table('person')->where('pid', '>', 0)->where('pid', $pid)->first([
            'pid', 'name_real', 'name_family', 'nat_id_nr', 'date_birth', 'sex',
        ]);
        abort_if(! $patient, 404, 'Data pasien tidak ditemukan.');

        $query = DB::table('regpatient as registration')
            ->leftJoin('department as department', 'department.did', '=', 'registration.current_dept_nr')
            ->leftJoin('hotel_bed as bed', 'bed.hbid', '=', 'registration.current_bed_nr')
            ->leftJoin('hotel_room as room', 'room.hrid', '=', 'bed.hrid')
            ->leftJoin('hotel_class as class', 'class.hcid', '=', 'room.hcid')
            ->leftJoin('person as doctor', 'doctor.pid', '=', 'registration.doctor_id')
            ->leftJoin('insurance_firm as guarantor', 'guarantor.ifirm_id', '=', 'registration.ifirm_id')
            ->where('registration.pid', $pid)
            ->select([
                'registration.regpid', 'registration.no_reg', 'registration.reg_date',
                'registration.discharge_date', 'registration.is_discharged', 'registration.is_del',
                'department.name_formal as department_name', 'class.class_name as inpatient_class_name',
                'room.room_prefix as inpatient_room_prefix', 'doctor.name_real as doctor_name',
                'guarantor.ifirm_name as guarantor_name',
            ]);

        if (! empty($validated['date_from'])) {
            $query->whereDate('registration.reg_date', '>=', $validated['date_from']);
        }
        if (! empty($validated['date_to'])) {
            $query->whereDate('registration.reg_date', '<=', $validated['date_to']);
        }

        $visits = $query->orderByDesc('registration.reg_date')->orderByDesc('registration.regpid')->get()
            ->map(fn (object $visit): array => [
                'regpid' => (int) $visit->regpid,
                'registration_number' => $this->value($visit->no_reg),
                'visit_date' => $this->displayDateTime($visit->reg_date),
                'department' => $this->visitDepartmentName($visit),
                'doctor' => $this->value($visit->doctor_name),
                'guarantor' => $this->value($visit->guarantor_name),
                'status' => $this->visitStatus($visit->is_discharged, $visit->is_del),
            ])->values();

        return response()->json(['data' => [
            'patient' => $this->patientSummary($patient),
            'visits' => $visits,
        ]]);
    }

    public function visit(int $regpid): JsonResponse
    {
        $registration = DB::table('regpatient as registration')
            ->join('person as patient', 'patient.pid', '=', 'registration.pid')
            ->leftJoin('department as department', 'department.did', '=', 'registration.current_dept_nr')
            ->leftJoin('hotel_bed as bed', 'bed.hbid', '=', 'registration.current_bed_nr')
            ->leftJoin('hotel_room as room', 'room.hrid', '=', 'bed.hrid')
            ->leftJoin('hotel_class as class', 'class.hcid', '=', 'room.hcid')
            ->leftJoin('person as doctor', 'doctor.pid', '=', 'registration.doctor_id')
            ->leftJoin('insurance_firm as guarantor', 'guarantor.ifirm_id', '=', 'registration.ifirm_id')
            ->where('registration.regpid', $regpid)
            ->where('patient.pid', '>', 0)
            ->first([
                'registration.regpid', 'registration.no_reg', 'registration.reg_date',
                'registration.discharge_date', 'registration.is_discharged', 'registration.is_del',
                'registration.reg_status', 'registration.no_sep',
                'patient.pid as patient_pid', 'patient.name_real', 'patient.name_family',
                'patient.nat_id_nr', 'patient.date_birth', 'patient.sex',
                'department.name_formal as department_name', 'class.class_name as inpatient_class_name',
                'room.room_prefix as inpatient_room_prefix', 'doctor.name_real as doctor_name',
                'guarantor.ifirm_name as guarantor_name',
            ]);

        abort_if(! $registration, 404, 'Data kunjungan tidak ditemukan.');

        return response()->json(['data' => [
            'patient' => $this->patientSummary((object) [
                'pid' => $registration->patient_pid,
                'name_real' => $registration->name_real,
                'name_family' => $registration->name_family,
                'nat_id_nr' => $registration->nat_id_nr,
                'date_birth' => $registration->date_birth,
                'sex' => $registration->sex,
            ]),
            'visit' => [
                'regpid' => (int) $registration->regpid,
                'registration_number' => $this->value($registration->no_reg),
                'admission_date' => $this->displayDateTime($registration->reg_date),
                'discharge_date' => $this->displayZonedDateTime($registration->discharge_date),
                'department' => $this->visitDepartmentName($registration),
                'primary_doctor' => $this->value($registration->doctor_name),
                'guarantor' => $this->value($registration->guarantor_name),
                'status' => $this->visitStatus($registration->is_discharged, $registration->is_del),
                'discharge_condition' => $this->value($registration->reg_status),
                'sep_number' => $this->value($registration->no_sep),
            ],
        ]]);
    }

    public function procedures(int $regpid): JsonResponse
    {
        $exists = DB::table('regpatient as registration')
            ->join('person as patient', 'patient.pid', '=', 'registration.pid')
            ->where('registration.regpid', $regpid)
            ->where('patient.pid', '>', 0)
            ->exists();
        abort_if(! $exists, 404, 'Data kunjungan tidak ditemukan.');

        $rows = DB::table('bill_patient_row as bill_row')
            ->leftJoin('bill_patient_header as header', 'header.bphid', '=', 'bill_row.bphid')
            ->where('bill_row.regpid', $regpid)
            ->get([
                'bill_row.bprid', 'bill_row.bphid', 'header.hdrname as category_name',
                'header.no_urut as category_order', 'bill_row.description', 'bill_row.input_date',
                'bill_row.numcount', 'bill_row.real_amount', 'bill_row.potongan', 'bill_row.amount',
            ]);

        $items = [];
        $summary = ['gross_amount' => 0.0, 'deduction_amount' => 0.0, 'patient_amount' => 0.0];

        foreach ($rows as $row) {
            $quantity = (float) $row->numcount;
            $grossAmount = (float) $row->real_amount;
            $deductionAmount = (float) $row->potongan;
            $patientAmount = (float) $row->amount;
            $unitPrice = $quantity == 0.0 ? $grossAmount : $grossAmount / $quantity;
            $categoryId = (int) ($row->bphid ?? 0);
            $category = $this->value($row->category_name);
            if ($category === '-') {
                $category = 'Biaya Lain';
            }
            $description = $this->value($row->description);
            $key = implode('|', [$categoryId, $description, number_format($unitPrice, 4, '.', '')]);

            if (! isset($items[$key])) {
                $items[$key] = [
                    'category_id' => $categoryId,
                    'category' => $category,
                    'category_order' => (int) ($row->category_order ?? 99999),
                    'description' => $description,
                    'quantity' => 0.0,
                    'unit_price' => round($unitPrice, 2),
                    'gross_amount' => 0.0,
                    'deduction_amount' => 0.0,
                    'patient_amount' => 0.0,
                    'first_date_raw' => $row->input_date,
                    'last_date_raw' => $row->input_date,
                ];
            }

            $items[$key]['quantity'] += $quantity;
            $items[$key]['gross_amount'] += $grossAmount;
            $items[$key]['deduction_amount'] += $deductionAmount;
            $items[$key]['patient_amount'] += $patientAmount;
            if ($row->input_date && (! $items[$key]['first_date_raw'] || $row->input_date < $items[$key]['first_date_raw'])) {
                $items[$key]['first_date_raw'] = $row->input_date;
            }
            if ($row->input_date && (! $items[$key]['last_date_raw'] || $row->input_date > $items[$key]['last_date_raw'])) {
                $items[$key]['last_date_raw'] = $row->input_date;
            }

            $summary['gross_amount'] += $grossAmount;
            $summary['deduction_amount'] += $deductionAmount;
            $summary['patient_amount'] += $patientAmount;
        }

        $groups = collect(array_values($items))
            ->groupBy('category_id')
            ->map(function ($categoryItems): array {
                $first = $categoryItems->first();
                $items = $categoryItems
                    ->sortBy(fn (array $item): string => ($item['first_date_raw'] ?? '9999-12-31').'|'.$item['description'])
                    ->map(function (array $item): array {
                        $item['period'] = $this->billingPeriod($item['first_date_raw'], $item['last_date_raw']);
                        unset($item['category_id'], $item['category'], $item['category_order'], $item['first_date_raw'], $item['last_date_raw']);

                        return $item;
                    })->values()->all();

                return [
                    'category_id' => $first['category_id'],
                    'category' => $first['category'],
                    '_order' => $first['category_order'],
                    'items' => $items,
                ];
            })
            ->sortBy(fn (array $group): string => str_pad((string) $group['_order'], 8, '0', STR_PAD_LEFT).'|'.str_pad((string) $group['category_id'], 8, '0', STR_PAD_LEFT))
            ->map(function (array $group): array {
                unset($group['_order']);

                return $group;
            })->values()->all();

        return response()->json(['data' => [
            'groups' => $groups,
            'summary' => array_map(fn (float $amount): float => round($amount, 2), $summary),
        ]]);
    }

    public function soap(int $regpid): JsonResponse
    {
        $exists = DB::table('regpatient as registration')
            ->join('person as patient', 'patient.pid', '=', 'registration.pid')
            ->where('registration.regpid', $regpid)
            ->where('patient.pid', '>', 0)
            ->exists();
        abort_if(! $exists, 404, 'Data kunjungan tidak ditemukan.');

        $doctorEntries = DB::table('kunjungan_dokter as soap')
            ->leftJoin('person as author', 'author.pid', '=', 'soap.pid')
            ->where('soap.regpid', $regpid)
            ->get([
                'soap.kdid', 'soap.pid as author_id', 'author.name_real as author_name',
                'soap.tgl_kunjungan as recorded_at_raw', 'soap.subjective', 'soap.objective',
                'soap.assesment', 'soap.planning',
            ])
            ->map(fn (object $entry): array => [
                'entry_id' => 'doctor-'.$entry->kdid,
                'entry_type' => 'doctor',
                'source' => 'kunjungan_dokter',
                'role_label' => 'Dokter',
                'kdid' => (int) $entry->kdid,
                'odpid' => null,
                'author_id' => (int) $entry->author_id,
                'author_name' => $this->value($entry->author_name),
                'doctor_pid' => (int) $entry->author_id,
                'doctor_name' => $this->value($entry->author_name),
                'recorded_at' => $this->displayDateTime($entry->recorded_at_raw),
                'subjective' => $this->value($entry->subjective),
                'objective' => $this->value($entry->objective),
                'assessment' => $this->value($entry->assesment),
                'planning' => $this->value($entry->planning),
                '_sort_time' => $this->soapSortTimestamp($entry->recorded_at_raw, 'Asia/Jakarta'),
                '_sort_id' => (int) $entry->kdid,
            ]);

        $doctorDiagnosisEntries = DB::table('ops_diagnosa as soap')
            ->leftJoin('person as author', 'author.pid', '=', 'soap.doctor_id')
            ->where('soap.regpid', $regpid)
            ->where(function (Builder $query): void {
                $query->where('soap.is_perawat', false)->orWhereNull('soap.is_perawat');
            })
            ->where(function (Builder $query): void {
                $query->whereRaw("NULLIF(TRIM(COALESCE(soap.subjective, '')), '') IS NOT NULL")
                    ->orWhereRaw("NULLIF(TRIM(COALESCE(soap.objective, '')), '') IS NOT NULL")
                    ->orWhereRaw("NULLIF(TRIM(COALESCE(soap.assesment, '')), '') IS NOT NULL")
                    ->orWhereRaw("NULLIF(TRIM(COALESCE(soap.planning, '')), '') IS NOT NULL");
            })
            ->get([
                'soap.odid', 'soap.doctor_id as author_id', 'author.name_real as author_name',
                'soap.create_time as create_time_raw', 'soap.diag_date as diag_date_raw',
                'soap.subjective', 'soap.objective', 'soap.assesment', 'soap.planning',
            ])
            ->map(function (object $entry): array {
                $recordedAt = $entry->create_time_raw ?: $entry->diag_date_raw;

                return [
                    'entry_id' => 'doctor-diagnosis-'.$entry->odid,
                    'entry_type' => 'doctor',
                    'source' => 'ops_diagnosa',
                    'role_label' => 'Dokter',
                    'kdid' => null,
                    'odid' => (int) $entry->odid,
                    'odpid' => null,
                    'catperid' => null,
                    'author_id' => (int) $entry->author_id,
                    'author_name' => $this->value($entry->author_name),
                    'doctor_pid' => (int) $entry->author_id,
                    'doctor_name' => $this->value($entry->author_name),
                    'recorded_at' => $this->displayDateTime($recordedAt),
                    'subjective' => $this->value($entry->subjective),
                    'objective' => $this->value($entry->objective),
                    'assessment' => $this->value($entry->assesment),
                    'planning' => $this->value($entry->planning),
                    '_sort_time' => $this->soapSortTimestamp($recordedAt, 'Asia/Jakarta'),
                    '_sort_id' => (int) $entry->odid,
                ];
            });

        $nurseDiagnosisEntries = DB::table('ops_diagnosa_perawat as soap')
            ->leftJoin('person as author', 'author.pid', '=', 'soap.create_id')
            ->where('soap.regpid', $regpid)
            ->get([
                'soap.odpid', 'soap.create_id as author_id', 'author.name_real as author_name',
                'soap.create_time as create_time_raw', 'soap.diag_date as diag_date_raw',
                'soap.subjective', 'soap.objective', 'soap.assesment', 'soap.planning',
            ])
            ->map(function (object $entry): array {
                $recordedAt = $entry->create_time_raw ?: $entry->diag_date_raw;

                return [
                    'entry_id' => 'nurse-diagnosis-'.$entry->odpid,
                    'entry_type' => 'nurse',
                    'source' => 'ops_diagnosa_perawat',
                    'role_label' => 'SOAP Perawat',
                    'kdid' => null,
                    'odpid' => (int) $entry->odpid,
                    'catperid' => null,
                    'author_id' => (int) $entry->author_id,
                    'author_name' => $this->value($entry->author_name),
                    'doctor_pid' => null,
                    'doctor_name' => null,
                    'recorded_at' => $this->displayDateTime($recordedAt),
                    'subjective' => $this->value($entry->subjective),
                    'objective' => $this->value($entry->objective),
                    'assessment' => $this->value($entry->assesment),
                    'planning' => $this->value($entry->planning),
                    '_sort_time' => $this->soapSortTimestamp($recordedAt, 'Asia/Jakarta'),
                    '_sort_id' => (int) $entry->odpid,
                ];
            });

        $nurseProgressEntries = DB::table('ops_catper as soap')
            ->leftJoin('person as author', 'author.pid', '=', 'soap.create_id')
            ->where('soap.regpid', $regpid)
            ->get([
                'soap.catperid', 'soap.create_id as author_id', 'author.name_real as author_name',
                'soap.create_time as recorded_at_raw', 'soap.subjective', 'soap.objective',
                'soap.assesment', 'soap.planning',
            ])
            ->map(fn (object $entry): array => [
                'entry_id' => 'nurse-progress-'.$entry->catperid,
                'entry_type' => 'nurse',
                'source' => 'ops_catper',
                'role_label' => 'SOAP Perawat',
                'kdid' => null,
                'odpid' => null,
                'catperid' => (int) $entry->catperid,
                'author_id' => (int) $entry->author_id,
                'author_name' => $this->value($entry->author_name),
                'doctor_pid' => null,
                'doctor_name' => null,
                'recorded_at' => $this->displayDateTime($entry->recorded_at_raw),
                'subjective' => $this->value($entry->subjective),
                'objective' => $this->value($entry->objective),
                'assessment' => $this->value($entry->assesment),
                'planning' => $this->value($entry->planning),
                '_sort_time' => $this->soapSortTimestamp($entry->recorded_at_raw, 'Asia/Jakarta'),
                '_sort_id' => (int) $entry->catperid,
            ]);

        $entries = $doctorEntries
            ->concat($doctorDiagnosisEntries)
            ->concat($nurseDiagnosisEntries)
            ->concat($nurseProgressEntries)
            ->sort(fn (array $first, array $second): int => [$first['_sort_time'], $first['_sort_id']] <=> [$second['_sort_time'], $second['_sort_id']])
            ->map(function (array $entry): array {
                unset($entry['_sort_time'], $entry['_sort_id']);

                return $entry;
            })
            ->values();

        return response()->json(['data' => $entries]);
    }

    private function soapSortTimestamp(mixed $date, ?string $assumedTimezone = null): int
    {
        if (! $date) {
            return PHP_INT_MAX;
        }

        return CarbonImmutable::parse($date, $assumedTimezone)->getTimestamp();
    }

    private function applySearch(Builder $query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $nameSearch = '%'.mb_strtolower($search).'%';
        $digits = preg_replace('/\D/', '', $search) ?? '';

        if ($digits !== '' && strlen($digits) <= 8 && preg_match('/^[\d\s.-]+$/', $search) === 1) {
            $query->where('pid', (int) $digits);
            return;
        }

        $query->where(function (Builder $nested) use ($nameSearch, $digits): void {
            $nested->whereRaw("LOWER(COALESCE(name_real, '') || ' ' || COALESCE(name_family, '')) LIKE ?", [$nameSearch]);
            if ($digits !== '' && strlen($digits) <= 8) {
                $nested->orWhere('pid', (int) $digits);
            }
        });
    }

    private function formatMedicalRecordNumber(int|string $pid): string
    {
        return implode('-', str_split(str_pad((string) $pid, 8, '0', STR_PAD_LEFT), 2));
    }

    private function fullName(object $person): string
    {
        return $this->value(trim(implode(' ', array_filter([$person->name_real, $person->name_family]))));
    }

    private function displayDate(mixed $date): string
    {
        return $date ? CarbonImmutable::parse($date)->locale('id')->translatedFormat('d M Y') : '-';
    }

    private function displayDateTime(mixed $date): string
    {
        return $date ? CarbonImmutable::parse($date)->locale('id')->translatedFormat('d M Y, H:i') : '-';
    }

    private function displayZonedDateTime(mixed $date): string
    {
        return $date ? CarbonImmutable::parse($date)->setTimezone('Asia/Jakarta')->locale('id')->translatedFormat('d M Y, H:i') : '-';
    }

    private function billingPeriod(mixed $firstDate, mixed $lastDate): string
    {
        $first = $this->displayDate($firstDate);
        $last = $this->displayDate($lastDate);

        return $first === $last ? $first : $first.' – '.$last;
    }

    private function patientSummary(object $person): array
    {
        return [
            'pid' => (int) $person->pid,
            'medical_record_number' => $this->formatMedicalRecordNumber($person->pid),
            'name' => $this->fullName($person),
            'national_id' => $this->value($person->nat_id_nr),
            'date_of_birth' => $this->displayDate($person->date_birth),
            'age' => $this->age($person->date_birth),
            'sex' => $this->sexLabel($person->sex),
        ];
    }

    private function visitDepartmentName(object $visit): string
    {
        $inpatientLocation = trim(implode(' ', array_filter([
            trim((string) ($visit->inpatient_class_name ?? '')),
            trim((string) ($visit->inpatient_room_prefix ?? '')),
        ])));

        return $this->value($inpatientLocation !== '' ? $inpatientLocation : $visit->department_name);
    }

    private function visitStatus(mixed $isDischarged, mixed $isDeleted): string
    {
        if ((bool) $isDeleted) {
            return 'Deleted';
        }

        if ($isDischarged === null) {
            return '-';
        }

        return (bool) $isDischarged ? 'Selesai' : 'Belum Pulang';
    }

    private function age(mixed $date): string
    {
        return $date ? CarbonImmutable::parse($date)->age.' tahun' : '-';
    }

    private function sexLabel(mixed $sex): string
    {
        return match (strtolower(trim((string) $sex))) {
            'm', 'l', 'male', 'laki-laki' => 'Laki-laki',
            'f', 'p', 'female', 'perempuan' => 'Perempuan',
            default => $this->value($sex),
        };
    }

    private function booleanLabel(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '-';
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'Ya' : 'Tidak';
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

    private function address(object $person): string
    {
        return $this->joinAddress([$person->addr_str, $person->kelurahan, $person->kecamatan, $person->kabupaten, $person->addr_city, $person->addr_province, $person->addr_zip]);
    }

    private function contactAddress(object $person): string
    {
        return $this->joinAddress([$person->contact_addr, $person->contact_kelurahan, $person->contact_kecamatan, $person->contact_kabupaten, $person->contact_city, $person->contact_province, $person->contact_zip]);
    }

    private function joinAddress(array $parts): string
    {
        $clean = array_values(array_filter(array_map(fn ($part) => trim((string) ($part ?? '')), $parts)));

        return $clean === [] ? '-' : implode(', ', array_unique($clean));
    }
}
