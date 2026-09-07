<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class WebUserAuthenticationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);
        DB::purge();
        $this->withoutMiddleware(ThrottleRequests::class);

        Schema::create('web_users', function (Blueprint $table): void {
            $table->string('login_name')->primary();
            $table->string('login_pass');
            $table->integer('pid')->nullable();
        });
        Schema::create('person', function (Blueprint $table): void {
            $table->integer('pid')->primary();
            $table->string('name_real')->nullable();
            $table->string('name_family')->nullable();
        });
    }

    public function test_user_can_login_with_web_users_credentials(): void
    {
        DB::table('person')->insert([
            'pid' => 501,
            'name_real' => 'Rizal',
            'name_family' => 'Prananda',
        ]);
        DB::table('web_users')->insert([
            'login_name' => 'operator.test',
            'login_pass' => password_hash('Secret.123', PASSWORD_BCRYPT),
            'pid' => 501,
        ]);

        $csrfToken = $this->getJson('/api/auth/csrf')
            ->assertOk()
            ->json('csrf_token');

        $response = $this
            ->withHeader('X-CSRF-TOKEN', $csrfToken)
            ->postJson('/api/auth/login', [
                'username' => 'operator.test',
                'password' => 'Secret.123',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.login_name', 'operator.test')
            ->assertJsonPath('user.full_name', 'Rizal Prananda');

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.login_name', 'operator.test')
            ->assertJsonPath('user.full_name', 'Rizal Prananda');
    }

    public function test_authenticated_user_can_change_their_own_password(): void
    {
        DB::table('web_users')->insert([
            'login_name' => 'operator.test',
            'login_pass' => md5('OldSecret.123'),
        ]);
        $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->withHeader('X-CSRF-TOKEN', $this->csrfToken())
            ->patchJson('/api/auth/password', [
                'current_password' => 'OldSecret.123',
                'password' => 'NewSecret.456',
                'password_confirmation' => 'NewSecret.456',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Password berhasil diubah.');

        $stored = (string) DB::table('web_users')->where('login_name', 'operator.test')->value('login_pass');
        $this->assertSame(md5('NewSecret.456'), $stored);
        $this->assertNotSame('NewSecret.456', $stored);
    }

    public function test_password_change_rejects_wrong_current_password_without_writing(): void
    {
        $original = md5('OldSecret.123');
        DB::table('web_users')->insert([
            'login_name' => 'operator.test',
            'login_pass' => $original,
        ]);

        $this->withSession(['web_user' => ['login_name' => 'operator.test']])
            ->withHeader('X-CSRF-TOKEN', $this->csrfToken())
            ->patchJson('/api/auth/password', [
                'current_password' => 'WrongSecret.123',
                'password' => 'NewSecret.456',
                'password_confirmation' => 'NewSecret.456',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Password saat ini tidak sesuai.');

        $this->assertSame($original, DB::table('web_users')->where('login_name', 'operator.test')->value('login_pass'));
    }

    public function test_guest_cannot_change_a_password(): void
    {
        $this->withHeader('X-CSRF-TOKEN', $this->csrfToken())
            ->patchJson('/api/auth/password', [
                'current_password' => 'OldSecret.123',
                'password' => 'NewSecret.456',
                'password_confirmation' => 'NewSecret.456',
            ])
            ->assertUnauthorized();
    }

    public function test_invalid_credentials_are_rejected_without_revealing_the_user(): void
    {
        DB::table('web_users')->insert([
            'login_name' => 'operator.test',
            'login_pass' => password_hash('Secret.123', PASSWORD_BCRYPT),
        ]);

        $this->withHeader('X-CSRF-TOKEN', $this->csrfToken())
            ->postJson('/api/auth/login', [
                'username' => 'operator.test',
                'password' => 'wrong-password',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Username atau password tidak sesuai.');

        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_legacy_md5_password_can_be_verified(): void
    {
        DB::table('web_users')->insert([
            'login_name' => 'legacy.user',
            'login_pass' => md5('Legacy.123'),
        ]);

        $this->withHeader('X-CSRF-TOKEN', $this->csrfToken())
            ->postJson('/api/auth/login', [
                'username' => 'legacy.user',
                'password' => 'Legacy.123',
            ])
            ->assertOk();
    }

    public function test_logout_invalidates_the_session(): void
    {
        DB::table('web_users')->insert([
            'login_name' => 'operator.test',
            'login_pass' => password_hash('Secret.123', PASSWORD_BCRYPT),
        ]);

        $this->withHeader('X-CSRF-TOKEN', $this->csrfToken())
            ->postJson('/api/auth/login', [
                'username' => 'operator.test',
                'password' => 'Secret.123',
            ])
            ->assertOk();

        $this->withHeader('X-CSRF-TOKEN', $this->csrfToken())
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    private function csrfToken(): string
    {
        return $this->getJson('/api/auth/csrf')
            ->assertOk()
            ->json('csrf_token');
    }
}
