<?php

namespace Tests\Feature;

use App\Services\WebUserPasswordVerifier;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class UserManagementReadOnlyTest extends TestCase
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
            $table->string('name_real')->nullable();
            $table->string('name_family')->nullable();
            $table->boolean('is_doctor')->nullable();
            $table->boolean('is_nurse')->nullable();
        });
        Schema::create('web_users', function (Blueprint $table): void {
            $table->integer('login_id')->primary();
            $table->integer('pid');
            $table->string('login_name');
            $table->string('login_pass');
            $table->integer('lockflag')->nullable();
            $table->boolean('is_admin')->nullable();
            $table->boolean('is_lock')->nullable();
            $table->boolean('is_del')->nullable();
            $table->dateTime('create_time')->nullable();
            $table->dateTime('lastvisit_date')->nullable();
            $table->dateTime('last_action')->nullable();
        });
        Schema::create('web_access_logs', function (Blueprint $table): void {
            $table->increments('walid');
            $table->integer('login_id');
            $table->dateTime('create_date');
        });

        DB::table('person')->insert([
            ['pid' => -2, 'name_real' => 'Ibrahim Arfan Maruli Siregar, A.Md.Kep', 'name_family' => '', 'is_doctor' => false, 'is_nurse' => true],
            ['pid' => -10, 'name_real' => 'Rizal Prananda', 'name_family' => '', 'is_doctor' => false, 'is_nurse' => false],
            ['pid' => -20, 'name_real' => 'dr. Santoso', 'name_family' => '', 'is_doctor' => true, 'is_nurse' => false],
            ['pid' => -30, 'name_real' => 'Petugas Lama', 'name_family' => '', 'is_doctor' => false, 'is_nurse' => false],
        ]);
        DB::table('web_users')->insert([
            ['login_id' => 63, 'pid' => -2, 'login_name' => 'ibrahim.arfan', 'login_pass' => 'secret-a', 'lockflag' => null, 'is_admin' => false, 'is_lock' => false, 'is_del' => false, 'create_time' => '2023-02-22 22:06:33', 'lastvisit_date' => null, 'last_action' => '2025-10-27 13:44:35'],
            ['login_id' => 1, 'pid' => -10, 'login_name' => 'rizal.prananda', 'login_pass' => 'secret-b', 'lockflag' => null, 'is_admin' => true, 'is_lock' => false, 'is_del' => false, 'create_time' => '2023-01-01 08:00:00', 'lastvisit_date' => null, 'last_action' => '2025-11-01 09:00:00'],
            ['login_id' => 2, 'pid' => -20, 'login_name' => 'dr.santoso', 'login_pass' => 'secret-c', 'lockflag' => 1, 'is_admin' => false, 'is_lock' => true, 'is_del' => false, 'create_time' => '2023-01-02 08:00:00', 'lastvisit_date' => null, 'last_action' => null],
            ['login_id' => 3, 'pid' => -30, 'login_name' => 'petugas.lama', 'login_pass' => 'secret-d', 'lockflag' => null, 'is_admin' => false, 'is_lock' => false, 'is_del' => true, 'create_time' => '2023-01-03 08:00:00', 'lastvisit_date' => null, 'last_action' => null],
        ]);
        DB::table('web_access_logs')->insert([
            ['login_id' => 63, 'create_date' => '2025-10-06 00:05:27'],
            ['login_id' => 63, 'create_date' => '2025-10-27 13:44:35'],
        ]);
    }

    public function test_user_list_requires_the_primary_admin_username(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();

        $this->withSession(['web_user' => ['login_name' => 'other.user']])
            ->getJson('/api/users')
            ->assertForbidden();
    }

    public function test_primary_admin_can_find_ibrahim_with_person_relation(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'rizal.prananda']])
            ->getJson('/api/users?search=ibrahim.arfan');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', 63)
            ->assertJsonPath('data.0.pid', -2)
            ->assertJsonPath('data.0.username', 'ibrahim.arfan')
            ->assertJsonPath('data.0.full_name', 'Ibrahim Arfan Maruli Siregar, A.Md.Kep')
            ->assertJsonPath('data.0.initials', 'IA')
            ->assertJsonPath('data.0.role', 'Perawat')
            ->assertJsonPath('data.0.status', 'Aktif')
            ->assertJsonPath('data.0.last_login', '27 Oct 2025, 13:44')
            ->assertJsonPath('data.0.created_at', '22 Feb 2023, 22:06');
    }

    public function test_user_list_supports_real_filters_and_pagination(): void
    {
        $response = $this->withSession(['web_user' => ['login_name' => 'rizal.prananda']])
            ->getJson('/api/users?role=Dokter&status=Nonaktif&per_page=2');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('data.0.username', 'dr.santoso')
            ->assertJsonPath('data.0.role', 'Dokter')
            ->assertJsonPath('data.0.status', 'Nonaktif');
    }

    public function test_user_profile_mutation_routes_remain_disabled_and_unchanged(): void
    {
        $before = DB::table('web_users')->orderBy('login_id')->get()->toJson();
        $session = $this->withSession(['web_user' => ['login_name' => 'rizal.prananda']]);

        $session->postJson('/api/users')->assertMethodNotAllowed();
        $session->putJson('/api/users/63')->assertMethodNotAllowed();
        $session->deleteJson('/api/users/63')->assertMethodNotAllowed();

        $this->assertSame($before, DB::table('web_users')->orderBy('login_id')->get()->toJson());
    }

    public function test_primary_admin_can_reset_a_user_password_in_legacy_compatible_format(): void
    {
        $response = $this->withSession(['_token' => 'csrf-test', 'web_user' => ['login_name' => 'rizal.prananda']])
            ->withHeader('X-CSRF-TOKEN', 'csrf-test')
            ->patchJson('/api/users/63/password', [
                'password' => 'Password.Baru224',
                'password_confirmation' => 'Password.Baru224',
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Password ibrahim.arfan berhasil direset.');

        $stored = (string) DB::table('web_users')->where('login_id', 63)->value('login_pass');
        $this->assertSame(md5('Password.Baru224'), $stored);
        $this->assertNotSame('Password.Baru224', $stored);
        $this->assertTrue(app(WebUserPasswordVerifier::class)->verify('Password.Baru224', $stored));
    }

    public function test_password_reset_rejects_non_admin_invalid_password_and_unknown_user(): void
    {
        $original = (string) DB::table('web_users')->where('login_id', 63)->value('login_pass');

        $this->withSession(['_token' => 'csrf-test', 'web_user' => ['login_name' => 'other.user']])
            ->withHeader('X-CSRF-TOKEN', 'csrf-test')
            ->patchJson('/api/users/63/password', [
                'password' => 'Password.Baru224',
                'password_confirmation' => 'Password.Baru224',
            ])->assertForbidden();

        $this->withSession(['_token' => 'csrf-test', 'web_user' => ['login_name' => 'rizal.prananda']])
            ->withHeader('X-CSRF-TOKEN', 'csrf-test')
            ->patchJson('/api/users/63/password', [
                'password' => 'terlalulemah',
                'password_confirmation' => 'tidaksama',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->withSession(['_token' => 'csrf-test', 'web_user' => ['login_name' => 'rizal.prananda']])
            ->withHeader('X-CSRF-TOKEN', 'csrf-test')
            ->patchJson('/api/users/999/password', [
                'password' => 'Password.Baru224',
                'password_confirmation' => 'Password.Baru224',
            ])->assertNotFound();

        $this->assertSame($original, DB::table('web_users')->where('login_id', 63)->value('login_pass'));
    }
}
