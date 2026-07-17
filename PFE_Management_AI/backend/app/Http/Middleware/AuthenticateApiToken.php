<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainToken = $request->bearerToken();
        if (!$plainToken) {
            return response()->json(['message' => 'Authentification requise.'], 401);
        }

        $token = ApiToken::with('user.role')
            ->where('access_token_hash', hash('sha256', $plainToken))
            ->whereNull('revoked_at')
            ->first();

        if (!$token || $token->expires_at->isPast()) {
            return response()->json(['message' => 'Jeton invalide ou expiré.'], 401);
        }

        if (!$token->user || !$token->user->is_active) {
            return response()->json(['message' => 'Ce compte est désactivé.'], 403);
        }
        if ($token->user->roleKey() === 'unknown') {
            return response()->json(['message' => 'Aucun rôle valide n’est attribué à ce compte.'], 403);
        }

        $request->setUserResolver(fn () => $token->user);
        $request->attributes->set('api_token', $token);

        if (!$token->last_used_at || $token->last_used_at->lt(now()->subMinute())) {
            $token->forceFill(['last_used_at' => now()])->saveQuietly();
        }

        return $next($request);
    }
}
