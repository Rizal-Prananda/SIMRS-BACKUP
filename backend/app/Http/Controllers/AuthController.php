<?php

namespace App\Http\Controllers;

use App\Services\WebUserPasswordVerifier;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
            $user = DB::table('web_users')
                ->where('login_name', trim($credentials['username']))
                ->first(['login_name', 'login_pass']);
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
        $request->session()->put('web_user', [
            'login_name' => (string) $user->login_name,
        ]);

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => $request->session()->get('web_user'),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->session()->get('web_user');

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json(['user' => $user]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logout berhasil.']);
    }
}
