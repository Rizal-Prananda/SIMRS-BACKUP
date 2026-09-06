<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'ok' => true,
        'application' => config('app.name'),
        'backend' => 'Laravel',
        'environment' => app()->environment(),
    ]);
});
