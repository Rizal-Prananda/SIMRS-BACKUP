<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MedicalRecordReadOnlyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);
        DB::purge();

        Schema::create('person', function (Blueprint $table): void {
            $table->integer('pid')->primary();
            $table->string('name_real');
            $table->string('name_family')->nullable();
            $table->date('date_birth')->nullable();
            $table->char('sex')->default('m');
            $table->string('birth_place')->nullable();
            $table->string('mobile_nr')->nullable();
            $table->string('ph_nr')->nullable();
            $table->string('email')->nullable();
            $table->string('addr_str')->nullable();
            $table->string('addr_city')->nullable();
            $table->string('kecamatan')->nullable();
            $table->string('kelurahan')->nullable();
            $table->string('kabupaten')->nullable();
            $table->string('addr_province')->nullable();
            $table->string('addr_zip')->nullable();
            $table->string('civil_status')->nullable();
            $table->string('religion')->nullable();
            $table->string('citizenship')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('contact_relation')->nullable();
            $table->string('contact_mobile_nr')->nullable();
            $table->string('contact_ph_nr')->nullable();
            $table->string('contact_addr')->nullable();
            $table->string('contact_kelurahan')->nullable();
            $table->string('contact_kecamatan')->nullable();
            $table->string('contact_kabupaten')->nullable();
            $table->string('contact_city')->nullable();
            $table->string('contact_province')->nullable();
            $table->string('contact_zip')->nullable();
            $table->string('blood_group')->nullable();
            $table->string('job')->nullable();
            $table->string('last_education')->nullable();
            $table->string('nat_id_nr')->nullable();
            $table->string('other_id')->nullable();
            $table->string('other_id_nr')->nullable();
            $table->boolean('is_emp')->nullable();
            $table->boolean('is_dead')->nullable();
            $table->boolean('is_blacklist')->nullable();
        });

        Schema::create('department', function (Blueprint $table): void {
            $table->integer('did')->primary();
            $table->string('name_formal');
        });

        Schema::create('insurance_firm', function (Blueprint $table): void {
            $table->integer('ifirm_id')->primary();
            $table->string('ifirm_name');
        });

        Schema::create('hotel_class', function (Blueprint $table): void {
            $table->integer('hcid')->primary();
            $table->string('class_name');
        });

        Schema::create('hotel_room', function (Blueprint $table): void {
            $table->integer('hrid')->primary();
            $table->integer('hcid');
            $table->string('room_prefix')->nullable();
        });

        Schema::create('hotel_bed', function (Blueprint $table): void {
            $table->integer('hbid')->primary();
            $table->integer('hrid');
        });

        Schema::create('regpatient', function (Blueprint $table): void {
            $table->integer('regpid')->primary();
            $table->integer('pid');
            $table->string('no_reg');
            $table->integer('current_dept_nr')->nullable();
            $table->integer('current_bed_nr')->nullable();
            $table->integer('doctor_id')->nullable();
            $table->integer('ifirm_id')->nullable();
            $table->dateTime('reg_date')->nullable();
            $table->dateTime('discharge_date')->nullable();
            $table->boolean('is_discharged')->nullable();
            $table->string('reg_status')->nullable();
            $table->string('no_sep')->nullable();
            $table->boolean('is_del')->nullable();
        });

        Schema::create('kunjungan_dokter', function (Blueprint $table): void {
            $table->integer('kdid')->primary();
            $table->integer('pid');
            $table->integer('regpid');
            $table->dateTime('tgl_kunjungan')->nullable();
            $table->text('subjective')->nullable();
            $table->text('objective')->nullable();
            $table->text('assesment')->nullable();
            $table->text('planning')->nullable();
        });

        Schema::create('ops_diagnosa_perawat', function (Blueprint $table): void {
            $table->integer('odpid')->primary();
            $table->integer('regpid');
            $table->dateTime('diag_date');
            $table->integer('doctor_id');
            $table->integer('create_id')->nullable();
            $table->dateTime('create_time')->nullable();
            $table->text('subjective')->nullable();
            $table->text('objective')->nullable();
            $table->text('assesment')->nullable();
            $table->text('planning')->nullable();
        });

        Schema::create('ops_catper', function (Blueprint $table): void {
            $table->integer('catperid')->primary();
            $table->integer('regpid');
            $table->integer('create_id')->nullable();
            $table->dateTime('create_time')->nullable();
            $table->text('subjective')->nullable();
            $table->text('objective')->nullable();
            $table->text('assesment')->nullable();
            $table->text('planning')->nullable();
        });

        Schema::create('bill_patient_header', function (Blueprint $table): void {
            $table->integer('bphid')->primary();
            $table->string('hdrname');
            $table->integer('no_urut')->nullable();
        });

        Schema::create('bill_patient_row', function (Blueprint $table): void {
            $table->integer('bprid')->primary();
            $table->integer('regpid');
            $table->integer('bphid')->nullable();
            $table->string('description')->nullable();
            $table->decimal('numcount', 12, 2);
            $table->decimal('real_amount', 18, 2);
            $table->decimal('potongan', 18, 2);
            $table->decimal('amount', 18, 2);
            $table->dateTime('input_date')->nullable();
        });

        DB::table('person')->insert([
            'pid' => 14768, 'name_real' => 'Siti', 'name_family' => 'Aminah', 'date_birth' => '1990-05-10', 'sex' => 'f', 'birth_place' => 'Surabaya', 'mobile_nr' => '08123456789', 'addr_str' => 'Jl. Melati 1', 'addr_city' => 'Surabaya', 'civil_status' => 'menikah', 'religion' => 'Islam', 'citizenship' => 'Indonesia', 'contact_person' => 'Budi', 'contact_relation' => 'Suami', 'contact_mobile_nr' => '08120000000', 'contact_addr' => 'Jl. Melati 1', 'blood_group' => 'A', 'job' => 'Guru', 'last_education' => 'S1', 'is_dead' => false, 'is_blacklist' => null,
        ]);
        DB::table('person')->insert([
            'pid' => 768, 'name_real' => 'Bambang', 'name_family' => null, 'date_birth' => null, 'sex' => 'm', 'birth_place' => null, 'mobile_nr' => null, 'addr_str' => null,
        ]);
        DB::table('person')->insert([
            'pid' => -570, 'name_real' => 'Akun Dokter', 'name_family' => null, 'date_birth' => null, 'sex' => 'm', 'birth_place' => null, 'mobile_nr' => null, 'addr_str' => null,
        ]);
        DB::table('person')->insert(['pid' => -113, 'name_real' => 'dr. Dokter Utama', 'name_family' => null]);
        DB::table('person')->insert(['pid' => -533, 'name_real' => 'dr. Dokter Pencatat', 'name_family' => null]);
        DB::table('person')->insert(['pid' => -515, 'name_real' => 'Dewi Wulandari', 'name_family' => null]);
        DB::table('department')->insert(['did' => 5, 'name_formal' => 'RAWAT INAP']);
        DB::table('insurance_firm')->insert(['ifirm_id' => 1185, 'ifirm_name' => 'BPJS KESEHATAN']);
        DB::table('hotel_class')->insert(['hcid' => 3, 'class_name' => 'KELAS 1']);
        DB::table('hotel_room')->insert(['hrid' => 181, 'hcid' => 3, 'room_prefix' => 'AMETYS']);
        DB::table('hotel_bed')->insert(['hbid' => 454, 'hrid' => 181]);
        DB::table('regpatient')->insert([
            ['regpid' => 90354, 'pid' => 14768, 'no_reg' => '2503250216', 'current_dept_nr' => 5, 'current_bed_nr' => 454, 'doctor_id' => -113, 'ifirm_id' => 1185, 'reg_date' => '2025-03-25 15:04:15', 'discharge_date' => '2025-03-27 12:51:52', 'is_discharged' => true, 'reg_status' => 'sembuh', 'no_sep' => '0301R0010325V000001', 'is_del' => false],
            ['regpid' => 87541, 'pid' => 14768, 'no_reg' => '2503130115', 'current_dept_nr' => 5, 'current_bed_nr' => null, 'doctor_id' => -113, 'ifirm_id' => null, 'reg_date' => '2025-03-13 13:13:12', 'discharge_date' => null, 'is_discharged' => false, 'reg_status' => null, 'no_sep' => null, 'is_del' => false],
        ]);
        DB::table('kunjungan_dokter')->insert([
            ['kdid' => 48677, 'pid' => -113, 'regpid' => 90354, 'tgl_kunjungan' => '2025-03-26 15:16:07', 'subjective' => "Keluhan utama\nsejak pagi", 'objective' => 'Tekanan darah stabil', 'assesment' => 'Observasi', 'planning' => 'Kontrol berkala'],
            ['kdid' => 48708, 'pid' => -533, 'regpid' => 90354, 'tgl_kunjungan' => '2025-03-27 08:56:58', 'subjective' => null, 'objective' => '', 'assesment' => 'Membaik', 'planning' => 'Pulang'],
        ]);
        DB::table('ops_diagnosa_perawat')->insert([
            'odpid' => 47180, 'regpid' => 90354, 'diag_date' => '2025-03-26 16:20:00', 'doctor_id' => -533, 'create_id' => -515, 'create_time' => '2025-03-26 16:20:00',
            'subjective' => "Keluhan perawat\nterpantau", 'objective' => 'Kondisi stabil', 'assesment' => 'Risiko rendah', 'planning' => 'Lanjut observasi',
        ]);
        DB::table('ops_catper')->insert([
            'catperid' => 216184, 'regpid' => 90354, 'create_id' => -515, 'create_time' => '2025-03-27 10:03:48',
            'subjective' => 'Keluhan terakhir', 'objective' => 'Observasi perawat', 'assesment' => 'Pemantauan', 'planning' => 'Lanjut perawatan',
        ]);
        DB::table('bill_patient_header')->insert([
            ['bphid' => 7, 'hdrname' => 'Biaya Kamar', 'no_urut' => 1],
            ['bphid' => 24, 'hdrname' => 'Administrasi Rawat Inap', 'no_urut' => 9999],
        ]);
        DB::table('bill_patient_row')->insert([
            ['bprid' => 1534822, 'regpid' => 90354, 'bphid' => 7, 'description' => 'Room Charge KELAS 1', 'numcount' => 1, 'real_amount' => 465000, 'potongan' => 0, 'amount' => 465000, 'input_date' => '2025-03-25 00:00:00'],
            ['bprid' => 1534823, 'regpid' => 90354, 'bphid' => 7, 'description' => 'Room Charge KELAS 1', 'numcount' => 1, 'real_amount' => 465000, 'potongan' => 0, 'amount' => 465000, 'input_date' => '2025-03-26 00:00:00'],
            ['bprid' => 1534831, 'regpid' => 90354, 'bphid' => 24, 'description' => 'Biaya Administrasi Rawat Inap', 'numcount' => 1, 'real_amount' => 200000, 'potongan' => 0, 'amount' => 200000, 'input_date' => '2025-03-27 12:51:52'],
        ]);
    }

    public function test_guest_cannot_access_medical_record_endpoints(): void
    {
        $this->getJson('/api/medical-records')->assertUnauthorized();
        $this->getJson('/api/medical-records/14768')->assertUnauthorized();
        $this->getJson('/api/medical-records/patients')->assertUnauthorized();
        $this->getJson('/api/medical-records/patients/14768/visits')->assertUnauthorized();
        $this->getJson('/api/medical-records/visits/90354')->assertUnauthorized();
        $this->getJson('/api/medical-records/visits/90354/soap')->assertUnauthorized();
        $this->getJson('/api/medical-records/visits/90354/procedures')->assertUnauthorized();
    }

    public function test_authenticated_user_can_search_and_paginate_patients(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/patients?search=00-01-47-68&per_page=10&page=1');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.pid', 14768)
            ->assertJsonPath('data.0.medical_record_number', '00-01-47-68')
            ->assertJsonPath('data.0.name', 'Siti Aminah')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 10);
    }

    public function test_patient_list_is_sorted_by_medical_record_number_ascending(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/patients?per_page=10&page=1');

        $response->assertOk()
            ->assertJsonPath('data.0.pid', 768)
            ->assertJsonPath('data.0.medical_record_number', '00-00-07-68')
            ->assertJsonPath('data.1.pid', 14768)
            ->assertJsonPath('data.1.medical_record_number', '00-01-47-68');
    }

    public function test_authenticated_user_can_view_read_only_patient_detail(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/14768');

        $response->assertOk()
            ->assertJsonPath('data.medical_record_number', '00-01-47-68')
            ->assertJsonPath('data.identity.pid', 14768)
            ->assertJsonPath('data.identity.name', 'Siti Aminah')
            ->assertJsonPath('data.contact.phone', '08123456789')
            ->assertJsonPath('data.guardian.name', 'Budi')
            ->assertJsonPath('data.additional.is_dead', 'Tidak')
            ->assertJsonPath('data.additional.is_blacklist', '-');
    }

    public function test_negative_doctor_account_pid_is_excluded_from_patient_records(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/patients?search=Akun Dokter');

        $response->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.total', 0);

        $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/-570')
            ->assertNotFound();
    }

    public function test_authenticated_user_can_view_visit_detail_by_regpid(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/visits/90354');

        $response->assertOk()
            ->assertJsonPath('data.patient.pid', 14768)
            ->assertJsonPath('data.patient.name', 'Siti Aminah')
            ->assertJsonPath('data.visit.regpid', 90354)
            ->assertJsonPath('data.visit.registration_number', '2503250216')
            ->assertJsonPath('data.visit.department', 'KELAS 1 AMETYS')
            ->assertJsonPath('data.visit.primary_doctor', 'dr. Dokter Utama')
            ->assertJsonPath('data.visit.guarantor', 'BPJS KESEHATAN')
            ->assertJsonPath('data.visit.status', 'Selesai')
            ->assertJsonPath('data.visit.sep_number', '0301R0010325V000001');
    }

    public function test_authenticated_user_can_view_grouped_read_only_procedure_costs(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/visits/90354/procedures');

        $response->assertOk()
            ->assertJsonCount(2, 'data.groups')
            ->assertJsonPath('data.groups.0.category_id', 7)
            ->assertJsonPath('data.groups.0.category', 'Biaya Kamar')
            ->assertJsonCount(1, 'data.groups.0.items')
            ->assertJsonPath('data.groups.0.items.0.description', 'Room Charge KELAS 1')
            ->assertJsonPath('data.groups.0.items.0.quantity', 2)
            ->assertJsonPath('data.groups.0.items.0.unit_price', 465000)
            ->assertJsonPath('data.groups.0.items.0.gross_amount', 930000)
            ->assertJsonPath('data.groups.0.items.0.deduction_amount', 0)
            ->assertJsonPath('data.groups.0.items.0.patient_amount', 930000)
            ->assertJsonPath('data.groups.0.items.0.period', '25 Mar 2025 – 26 Mar 2025')
            ->assertJsonPath('data.groups.1.category', 'Administrasi Rawat Inap')
            ->assertJsonPath('data.summary.gross_amount', 1130000)
            ->assertJsonPath('data.summary.deduction_amount', 0)
            ->assertJsonPath('data.summary.patient_amount', 1130000);
    }

    public function test_visit_without_billing_rows_returns_empty_procedure_costs(): void
    {
        $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/visits/87541/procedures')
            ->assertOk()
            ->assertExactJson(['data' => [
                'groups' => [],
                'summary' => ['gross_amount' => 0, 'deduction_amount' => 0, 'patient_amount' => 0],
            ]]);
    }

    public function test_authenticated_user_can_view_separate_sorted_soap_entries(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/visits/90354/soap');

        $response->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.kdid', 48677)
            ->assertJsonPath('data.0.entry_type', 'doctor')
            ->assertJsonPath('data.0.doctor_pid', -113)
            ->assertJsonPath('data.0.doctor_name', 'dr. Dokter Utama')
            ->assertJsonPath('data.0.subjective', "Keluhan utama\nsejak pagi")
            ->assertJsonPath('data.0.assessment', 'Observasi')
            ->assertJsonPath('data.1.odpid', 47180)
            ->assertJsonPath('data.1.entry_type', 'nurse')
            ->assertJsonPath('data.1.role_label', 'SOAP Perawat')
            ->assertJsonPath('data.1.author_name', 'Dewi Wulandari')
            ->assertJsonPath('data.1.subjective', "Keluhan perawat\nterpantau")
            ->assertJsonPath('data.2.kdid', 48708)
            ->assertJsonPath('data.2.doctor_name', 'dr. Dokter Pencatat')
            ->assertJsonPath('data.2.subjective', '-')
            ->assertJsonPath('data.2.objective', '-')
            ->assertJsonPath('data.3.catperid', 216184)
            ->assertJsonPath('data.3.source', 'ops_catper')
            ->assertJsonPath('data.3.entry_type', 'nurse')
            ->assertJsonPath('data.3.role_label', 'SOAP Perawat')
            ->assertJsonPath('data.3.author_name', 'Dewi Wulandari')
            ->assertJsonPath('data.3.recorded_at', '27 Mar 2025, 10:03');
    }

    public function test_visit_without_final_soap_returns_an_empty_list(): void
    {
        $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/visits/87541/soap')
            ->assertOk()
            ->assertExactJson(['data' => []]);
    }

    public function test_visit_period_filter_accepts_an_independent_end_date(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/patients/14768/visits?date_to=2025-03-20');

        $response->assertOk()
            ->assertJsonCount(1, 'data.visits')
            ->assertJsonPath('data.visits.0.regpid', 87541);
    }

    public function test_medical_record_api_exposes_no_mutation_routes(): void
    {
        $routes = collect(app('router')->getRoutes()->getRoutes())
            ->filter(fn ($route) => str_starts_with($route->uri(), 'api/medical-records'));

        $this->assertNotEmpty($routes);
        $this->assertTrue($routes->every(fn ($route) => $route->methods() === ['GET', 'HEAD']));
    }

    public function test_authenticated_user_can_list_patient_visits_by_pid(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/medical-records/patients/14768/visits');

        $response->assertOk()
            ->assertJsonPath('data.patient.pid', 14768)
            ->assertJsonPath('data.patient.medical_record_number', '00-01-47-68')
            ->assertJsonPath('data.patient.national_id', '-')
            ->assertJsonCount(2, 'data.visits')
            ->assertJsonPath('data.visits.0.regpid', 90354)
            ->assertJsonPath('data.visits.0.registration_number', '2503250216')
            ->assertJsonPath('data.visits.0.department', 'KELAS 1 AMETYS')
            ->assertJsonPath('data.visits.0.doctor', 'dr. Dokter Utama')
            ->assertJsonPath('data.visits.0.guarantor', 'BPJS KESEHATAN')
            ->assertJsonPath('data.visits.0.status', 'Selesai')
            ->assertJsonPath('data.visits.1.department', 'RAWAT INAP')
            ->assertJsonPath('data.visits.1.status', 'Belum Pulang');
    }
}
