<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWebUserAuthenticated
{
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        if (! $request->session()->has('web_user')) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return $next($request);
    }
}
