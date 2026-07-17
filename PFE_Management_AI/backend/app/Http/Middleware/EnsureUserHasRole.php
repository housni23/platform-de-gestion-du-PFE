<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    private const ROLE_NAMES = [
        'student' => 'Etudiant',
        'supervisor' => 'Encadrant',
        'chef' => 'Chef de filiere',
        'admin' => 'Super Admin',
    ];

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $roleName = $request->user()?->role?->name;
        $allowed = array_map(fn (string $role) => self::ROLE_NAMES[$role] ?? $role, $roles);

        if (!$roleName || !in_array($roleName, $allowed, true)) {
            return response()->json(['message' => 'Accès non autorisé pour ce rôle.'], 403);
        }

        return $next($request);
    }
}
