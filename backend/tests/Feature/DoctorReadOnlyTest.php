<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DoctorReadOnlyTest extends TestCase
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
            $table->boolean('is_doctor')->default(false);
            $table->boolean('is_del')->nullable();
            $table->boolean('is_visible')->nullable();
            $table->string('date_birth')->nullable();
            $table->string('sex')->nullable();
            $table->string('birth_place')->nullable();
            $table->string('religion')->nullable();
            $table->string('civil_status')->nullable();
            $table->string('mobile_nr')->nullable();
            $table->string('ph_nr')->nullable();
            $table->string('email')->nullable();
            $table->string('addr_str')->nullable();
            $table->string('kelurahan')->nullable();
            $table->string('kecamatan')->nullable();
            $table->string('kabupaten')->nullable();
            $table->string('addr_city')->nullable();
            $table->string('addr_province')->nullable();
            $table->string('addr_zip')->nullable();
            $table->string('ihs_nakes')->nullable();
        });
        Schema::create('emp', function (Blueprint $table): void {
            $table->integer('empid')->primary();
            $table->integer('pid')->nullable();
            $table->string('short_id')->nullable();
            $table->string('ir_code')->nullable();
            $table->string('nomor_dokter')->nullable();
            $table->string('sip')->nullable();
            $table->integer('kd_dpjp')->nullable();
            $table->boolean('is_discharged')->nullable();
            $table->string('job_function_title')->nullable();
            $table->string('workingstatus')->nullable();
            $table->date('date_join')->nullable();
            $table->date('date_exit')->nullable();
        });
        Schema::create('department', function (Blueprint $table): void {
            $table->integer('did')->primary();
            $table->string('dept_code')->nullable();
            $table->string('name_short')->nullable();
            $table->string('name_formal')->nullable();
            $table->string('dept_location')->nullable();
            $table->boolean('is_spesialis')->nullable();
            $table->boolean('is_inactive')->nullable();
            $table->boolean('is_del')->nullable();
            $table->string('bpjs_dept_code')->nullable();
            $table->string('ihs_location')->nullable();
        });
        Schema::create('doctor_dept', function (Blueprint $table): void {
            $table->integer('ddid')->primary();
            $table->integer('empid');
            $table->integer('did');
        });
        Schema::create('doctor_schedule', function (Blueprint $table): void {
            $table->integer('dsid')->primary();
            $table->integer('pid');
            $table->integer('did');
            $table->integer('weekday');
            $table->integer('start_hour');
            $table->integer('start_minute');
            $table->integer('end_hour');
            $table->integer('end_minute');
            $table->string('daily_room')->nullable();
            $table->string('daily_floor')->nullable();
            $table->boolean('is_bpjs')->nullable();
            $table->integer('kuota_hfis')->nullable();
        });

        DB::table('person')->insert(['pid' => -251, 'name_real' => 'dr. A. Iffa Maududy, Sp.B.,FINACS', 'is_doctor' => true, 'is_del' => false, 'is_visible' => true, 'date_birth' => '1990-01-01', 'sex' => 'm', 'birth_place' => 'Bandung', 'religion' => 'Islam', 'civil_status' => 'Menikah', 'mobile_nr' => '0812345', 'email' => 'dokter@example.test', 'addr_str' => 'Jl. Sehat', 'addr_city' => 'Surabaya', 'ihs_nakes' => '10001160431']);
        DB::table('person')->insert(['pid' => 14768, 'name_real' => 'Pasien Bukan Dokter', 'is_doctor' => false]);
        DB::table('emp')->insert(['empid' => 1937, 'pid' => -251, 'nomor_dokter' => 'ND-251', 'sip' => '503/SIP/2023', 'kd_dpjp' => 428324, 'is_discharged' => false, 'job_function_title' => 'Dokter Spesialis', 'workingstatus' => 'Tetap', 'date_join' => '2020-01-02']);
        DB::table('department')->insert(['did' => 20, 'dept_code' => 'bdh_umum', 'name_short' => 'POLI BEDAH', 'name_formal' => 'POLIKLINIK SPESIALIS BEDAH', 'dept_location' => 'POLIKLINIK', 'is_spesialis' => true, 'is_inactive' => false, 'is_del' => false, 'bpjs_dept_code' => 'BED', 'ihs_location' => 'loc-20']);
        DB::table('doctor_dept')->insert(['ddid' => 42506, 'empid' => 1937, 'did' => 20]);
        DB::table('doctor_schedule')->insert(['dsid' => 1329, 'pid' => -251, 'did' => 20, 'weekday' => 1, 'start_hour' => 14, 'start_minute' => 30, 'end_hour' => 16, 'end_minute' => 0, 'daily_room' => 'BPJS & UMUM', 'daily_floor' => '2', 'is_bpjs' => true, 'kuota_hfis' => 15]);
    }

    private function authenticatedGet(string $uri)
    {
        return $this->withSession(['web_user' => ['login_name' => 'operator.test']])->getJson($uri);
    }

    public function test_authenticated_user_can_search_and_paginate_doctors(): void
    {
        $this->authenticatedGet('/api/doctors?search=Iffa&per_page=10&page=1&sort=name&direction=asc')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.pid', -251)
            ->assertJsonPath('data.0.doctor_code', '-251')
            ->assertJsonPath('data.0.name', 'dr. A. Iffa Maududy, Sp.B.,FINACS')
            ->assertJsonPath('data.0.departments.0.name', 'POLIKLINIK SPESIALIS BEDAH')
            ->assertJsonPath('data.0.is_specialist', 'Ya')
            ->assertJsonPath('data.0.bpjs_id', '428324')
            ->assertJsonPath('data.0.ihs_id', '10001160431')
            ->assertJsonPath('data.0.room', 'BPJS & UMUM')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.per_page', 10);
    }

    public function test_authenticated_user_can_view_doctor_profile(): void
    {
        $this->authenticatedGet('/api/doctors/-251')
            ->assertOk()
            ->assertJsonPath('data.identity.pid', -251)
            ->assertJsonPath('data.identity.name', 'dr. A. Iffa Maududy, Sp.B.,FINACS')
            ->assertJsonPath('data.identity.sex', 'Laki-laki')
            ->assertJsonPath('data.identity.date_of_birth', '01-01-1990')
            ->assertJsonPath('data.employee.empid', '1937')
            ->assertJsonPath('data.employee.doctor_number', 'ND-251')
            ->assertJsonPath('data.employee.sip', '503/SIP/2023')
            ->assertJsonPath('data.employee.kd_dpjp', '428324')
            ->assertJsonPath('data.is_active', true);
    }

    public function test_authenticated_user_can_view_doctor_departments(): void
    {
        $this->authenticatedGet('/api/doctors/-251/departments')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.did', 20)
            ->assertJsonPath('data.0.code', 'bdh_umum')
            ->assertJsonPath('data.0.is_specialist', 'Ya')
            ->assertJsonPath('data.0.is_active', true);
    }

    public function test_authenticated_user_can_view_doctor_schedules_with_indonesian_weekday(): void
    {
        $this->authenticatedGet('/api/doctors/-251/schedules')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.day', 'Senin')
            ->assertJsonPath('data.0.start_time', '14:30')
            ->assertJsonPath('data.0.end_time', '16:00')
            ->assertJsonPath('data.0.department', 'POLIKLINIK SPESIALIS BEDAH')
            ->assertJsonPath('data.0.room', 'BPJS & UMUM')
            ->assertJsonPath('data.0.bpjs', 'Ya')
            ->assertJsonPath('data.0.hfis_quota', '15');
    }

    public function test_doctor_api_is_authenticated_and_exposes_only_get_routes(): void
    {
        $this->getJson('/api/doctors')->assertUnauthorized();
        $this->getJson('/api/doctors/-251')->assertUnauthorized();

        $routes = collect(app('router')->getRoutes()->getRoutes())
            ->filter(fn ($route) => str_starts_with($route->uri(), 'api/doctors'));

        $this->assertCount(4, $routes);
        $this->assertTrue($routes->every(fn ($route) => $route->methods() === ['GET', 'HEAD']));
    }
}
