<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DepartmentReadOnlyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);
        DB::purge();

        Schema::create('department', function (Blueprint $table): void {
            $table->integer('did')->primary();
            $table->string('dept_code')->nullable();
            $table->string('name_short');
            $table->string('name_formal')->nullable();
            $table->string('dept_location')->nullable();
            $table->integer('spesialist_id')->nullable();
            $table->boolean('is_spesialis');
            $table->boolean('is_inactive')->nullable();
            $table->boolean('is_del')->nullable();
        });

        DB::table('department')->insert([
            ['did' => 20, 'dept_code' => 'bdh_umum', 'name_short' => 'POLI BEDAH', 'name_formal' => 'POLIKLINIK SPESIALIS BEDAH', 'dept_location' => 'POLIKLINIK', 'spesialist_id' => 140, 'is_spesialis' => true, 'is_inactive' => false, 'is_del' => false],
            ['did' => 30, 'dept_code' => 'igd', 'name_short' => 'IGD', 'name_formal' => 'INSTALASI GAWAT DARURAT', 'dept_location' => 'GEDUNG UTAMA', 'spesialist_id' => null, 'is_spesialis' => false, 'is_inactive' => true, 'is_del' => true],
            ['did' => 40, 'dept_code' => null, 'name_short' => 'TANPA KODE', 'name_formal' => null, 'dept_location' => null, 'spesialist_id' => null, 'is_spesialis' => false, 'is_inactive' => null, 'is_del' => null],
        ]);
    }

    public function test_authenticated_user_can_search_sort_and_paginate_all_departments(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/master/departments?search=instalasi&limit=10&page=1&sort=code&direction=asc');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.did', 30)
            ->assertJsonPath('data.0.code', 'igd')
            ->assertJsonPath('data.0.name', 'INSTALASI GAWAT DARURAT')
            ->assertJsonPath('data.0.short_name', 'IGD')
            ->assertJsonPath('data.0.location', 'GEDUNG UTAMA')
            ->assertJsonPath('data.0.is_specialist', 'Tidak')
            ->assertJsonPath('data.0.active_status', 'Nonaktif')
            ->assertJsonPath('data.0.delete_status', 'Deleted')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.limit', 10);
    }

    public function test_default_list_keeps_deleted_rows_and_formats_null_values(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->getJson('/api/master/departments?limit=100&sort=code&direction=asc');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment(['did' => 30, 'delete_status' => 'Deleted'])
            ->assertJsonFragment(['did' => 40, 'code' => '-', 'name' => '-', 'location' => '-', 'active_status' => '-', 'delete_status' => '-']);
    }

    public function test_department_endpoint_is_authenticated_and_get_only(): void
    {
        $this->getJson('/api/master/departments')->assertUnauthorized();

        $routes = collect(app('router')->getRoutes()->getRoutes())
            ->filter(fn ($route) => $route->uri() === 'api/master/departments');

        $this->assertCount(1, $routes);
        $this->assertTrue($routes->every(fn ($route) => $route->methods() === ['GET', 'HEAD']));
    }
}
