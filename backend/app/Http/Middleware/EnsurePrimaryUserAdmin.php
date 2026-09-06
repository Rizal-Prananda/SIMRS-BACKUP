<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePrimaryUserAdmin
{
    private const ADMIN_USERNAME = 'rizal.prananda';

    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $username = (string) data_get($request->session()->get('web_user'), 'login_name', '');

        if ($username !== self::ADMIN_USERNAME) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
