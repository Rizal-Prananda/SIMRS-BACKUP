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
        });
    }

    public function test_user_can_login_with_web_users_credentials(): void
    {
        DB::table('web_users')->insert([
            'login_name' => 'operator.test',
            'login_pass' => password_hash('Secret.123', PASSWORD_BCRYPT),
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
            ->assertJsonPath('user.login_name', 'operator.test');

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.login_name', 'operator.test');
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
