<?php

namespace App\Http\Controllers;

use App\Services\WebUserPasswordVerifier;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function csrf(Request $request): JsonResponse
    {
        return response()->json(['csrf_token' => csrf_token()]);
    }

    public function login(Request $request, WebUserPasswordVerifier $passwordVerifier): JsonResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        try {
            $user = DB::table('web_users as users')
                ->leftJoin('person', 'person.pid', '=', 'users.pid')
                ->where('users.login_name', trim($credentials['username']))
                ->first(['users.login_name', 'users.login_pass', 'person.name_real', 'person.name_family']);
        } catch (QueryException) {
            return response()->json([
                'message' => 'Database SIMRS belum dapat dihubungi.',
            ], 503);
        }

        if (! $user || ! $passwordVerifier->verify($credentials['password'], (string) $user->login_pass)) {
            return response()->json([
                'message' => 'Username atau password tidak sesuai.',
            ], 422);
        }

        $request->session()->regenerate();
        $request->session()->put('web_user', $this->profilePayload($user));

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => $request->session()->get('web_user'),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $sessionUser = $request->session()->get('web_user');

        if (! $sessionUser) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        try {
            $row = DB::table('web_users as users')
                ->leftJoin('person', 'person.pid', '=', 'users.pid')
                ->where('users.login_name', (string) $sessionUser['login_name'])
                ->first(['users.login_name', 'person.name_real', 'person.name_family']);
        } catch (QueryException) {
            return response()->json(['message' => 'Database SIMRS belum dapat dihubungi.'], 503);
        }

        if (! $row) {
            $request->session()->invalidate();
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = $this->profilePayload($row);
        $request->session()->put('web_user', $user);

        return response()->json(['user' => $user]);
    }

    public function changePassword(Request $request, WebUserPasswordVerifier $passwordVerifier): JsonResponse
    {
        $credentials = $request->validate([
            'current_password' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'confirmed', 'max:255', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);
        $loginName = (string) $request->session()->get('web_user.login_name');

        try {
            $storedPassword = DB::table('web_users')->where('login_name', $loginName)->value('login_pass');
            if (! is_string($storedPassword) || ! $passwordVerifier->verify($credentials['current_password'], $storedPassword)) {
                return response()->json(['message' => 'Password saat ini tidak sesuai.'], 422);
            }

            DB::table('web_users')
                ->where('login_name', $loginName)
                ->update(['login_pass' => hash('md5', $credentials['password'])]);
        } catch (QueryException) {
            return response()->json(['message' => 'Password gagal disimpan ke database SIMRS.'], 503);
        }

        return response()->json(['message' => 'Password berhasil diubah.']);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logout berhasil.']);
    }

    private function profilePayload(object $user): array
    {
        $fullName = trim(implode(' ', array_filter([
            trim((string) ($user->name_real ?? '')),
            trim((string) ($user->name_family ?? '')),
        ])));
        $loginName = (string) $user->login_name;

        return [
            'login_name' => $loginName,
            'full_name' => $fullName !== '' ? $fullName : $loginName,
        ];
    }
}
