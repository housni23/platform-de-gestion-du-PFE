<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AiAssistantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChefController;
use App\Http\Controllers\Api\PfeModificationRequestController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SupervisorController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::get('google/url', [AuthController::class, 'googleUrl'])->middleware('throttle:login');
    Route::post('google/callback', [AuthController::class, 'googleCallback'])->middleware('throttle:login');
    Route::post('refresh', [AuthController::class, 'refresh'])->middleware('throttle:login');
});

Route::middleware(['auth.api', 'throttle:api'])->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('documents/{document}/download', [StudentController::class, 'downloadDocument']);

    Route::prefix('ai')->middleware('throttle:ai')->group(function () {
        Route::get('bootstrap', [AiAssistantController::class, 'bootstrap']);
        Route::get('conversations/{conversation}', [AiAssistantController::class, 'show']);
        Route::post('chat', [AiAssistantController::class, 'chat']);
        Route::delete('conversations/{conversation}', [AiAssistantController::class, 'destroy']);
    });

    Route::prefix('student')->middleware('role:student')->group(function () {
        Route::get('dashboard', [StudentController::class, 'getDashboard']);
        Route::put('pfe', [StudentController::class, 'savePfe']);
        Route::post('pfe/submit', [StudentController::class, 'submitPfe']);
        Route::post('pfe/modification-request', [PfeModificationRequestController::class, 'store']);
        Route::post('reports', [StudentController::class, 'addReport']);
        Route::post('documents', [StudentController::class, 'uploadDocument']);
        Route::get('messages', [StudentController::class, 'getMessages']);
        Route::post('messages', [StudentController::class, 'sendMessage']);
        Route::post('appointments', [StudentController::class, 'requestAppointment']);
        Route::patch('notifications/{notification}/read', [StudentController::class, 'markNotificationRead']);
    });

    Route::prefix('supervisor')->middleware('role:supervisor')->group(function () {
        Route::get('dashboard', [SupervisorController::class, 'getDashboard']);
        Route::post('pfes/{pfeId}/subject-decision', [SupervisorController::class, 'validateSubject']);
        Route::post('modification-requests/{modificationRequest}/decision', [PfeModificationRequestController::class, 'supervisorDecision']);
        Route::post('documents/{document}/review', [SupervisorController::class, 'reviewDocument']);
        Route::get('pfes/{pfeId}/messages', [SupervisorController::class, 'getMessages']);
        Route::post('pfes/{pfeId}/messages', [SupervisorController::class, 'sendMessage']);
        Route::post('appointments/{appointment}/response', [SupervisorController::class, 'respondAppointment']);
        Route::post('evaluations', [SupervisorController::class, 'submitEvaluation']);
    });

    Route::prefix('chef')->middleware('role:chef')->group(function () {
        Route::get('dashboard', [ChefController::class, 'getDashboard']);
        Route::post('pfes/{pfeId}/final-decision', [ChefController::class, 'finalValidate']);
        Route::post('modification-requests/{modificationRequest}/decision', [PfeModificationRequestController::class, 'chefDecision']);
        Route::post('pfes/{pfeId}/supervisor', [ChefController::class, 'assignSupervisor']);
        Route::post('conventions/{document}/review', [ChefController::class, 'validateConvention']);
        Route::post('defenses', [ChefController::class, 'scheduleDefense']);
        Route::get('exports/pfes.csv', [ChefController::class, 'exportPfeCsv']);
    });

    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('dashboard', [AdminController::class, 'getDashboard']);
        Route::post('users', [AdminController::class, 'createUser']);
        Route::put('users/{user}/role', [AdminController::class, 'updateRole']);
        Route::patch('users/{user}/toggle', [AdminController::class, 'toggleUserStatus']);
        Route::delete('users/{user}', [AdminController::class, 'deleteUser']);
        Route::post('filieres', [AdminController::class, 'saveFiliere']);
        Route::put('filieres/{filiere}', [AdminController::class, 'saveFiliere']);
        Route::post('academic-years', [AdminController::class, 'saveAcademicYear']);
        Route::put('academic-years/{academicYear}', [AdminController::class, 'saveAcademicYear']);
        Route::get('audit-logs', [AdminController::class, 'auditLogs']);
        Route::post('modification-requests/{modificationRequest}/decision', [PfeModificationRequestController::class, 'adminDecision']);
    });
});
