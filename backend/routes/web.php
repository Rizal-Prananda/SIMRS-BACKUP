<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\MedicalRecordController;
use App\Http\Controllers\UserManagementController;
use App\Http\Middleware\EnsurePrimaryUserAdmin;
use App\Http\Middleware\EnsureWebUserAuthenticated;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api/auth')->controller(AuthController::class)->group(function (): void {
    Route::get('/csrf', 'csrf');
    Route::post('/login', 'login')->middleware('throttle:5,1');
    Route::get('/me', 'me');
    Route::post('/logout', 'logout');
});

Route::get('api/master/departments', [DepartmentController::class, 'index'])
    ->middleware(EnsureWebUserAuthenticated::class);

Route::prefix('api/users')
    ->middleware([EnsureWebUserAuthenticated::class, EnsurePrimaryUserAdmin::class])
    ->controller(UserManagementController::class)
    ->group(function (): void {
        Route::get('/', 'index');
        Route::get('/{loginId}', 'show')->whereNumber('loginId');
    });

Route::prefix('api/doctors')
    ->middleware(EnsureWebUserAuthenticated::class)
    ->controller(DoctorController::class)
    ->group(function (): void {
        Route::get('/', 'index');
        Route::get('/{pid}', 'show')->where('pid', '-?[0-9]+');
        Route::get('/{pid}/departments', 'departments')->where('pid', '-?[0-9]+');
        Route::get('/{pid}/schedules', 'schedules')->where('pid', '-?[0-9]+');
    });

Route::prefix('api/medical-records')
    ->middleware(EnsureWebUserAuthenticated::class)
    ->controller(MedicalRecordController::class)
    ->group(function (): void {
        Route::get('/', 'index');
        Route::get('/patients', 'index');
        Route::get('/patients/{pid}/visits', 'visits')->whereNumber('pid');
        Route::get('/visits/{regpid}/soap', 'soap')->whereNumber('regpid');
        Route::get('/visits/{regpid}/procedures', 'procedures')->whereNumber('regpid');
        Route::get('/visits/{regpid}', 'visit')->whereNumber('regpid');
        Route::get('/{pid}', 'show')->whereNumber('pid');
    });
