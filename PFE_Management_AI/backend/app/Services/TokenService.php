<?php

namespace App\Services;

use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TokenService
{
    public static function issue(User $user, Request $request, string $name = 'web'): array
    {
        return DB::transaction(function () use ($user, $request, $name) {
            $plainAccessToken = Str::random(80);
            $plainRefreshToken = Str::random(96);
            $accessMinutes = (int) config('pfe.auth.access_token_minutes', 30);
            $refreshDays = (int) config('pfe.auth.refresh_token_days', 14);

            $token = ApiToken::create([
                'user_id' => $user->id,
                'name' => $name,
                'access_token_hash' => hash('sha256', $plainAccessToken),
                'refresh_token_hash' => hash('sha256', $plainRefreshToken),
                'expires_at' => now()->addMinutes($accessMinutes),
                'refresh_expires_at' => now()->addDays($refreshDays),
                'ip_address' => $request->ip(),
                'user_agent' => mb_substr((string) $request->userAgent(), 0, 1000),
            ]);

            return self::response($token, $plainAccessToken, $plainRefreshToken);
        });
    }

    public static function rotate(ApiToken $token, Request $request): array
    {
        return DB::transaction(function () use ($token, $request) {
            $plainAccessToken = Str::random(80);
            $plainRefreshToken = Str::random(96);
            $token->update([
                'access_token_hash' => hash('sha256', $plainAccessToken),
                'refresh_token_hash' => hash('sha256', $plainRefreshToken),
                'expires_at' => now()->addMinutes((int) config('pfe.auth.access_token_minutes', 30)),
                'refresh_expires_at' => now()->addDays((int) config('pfe.auth.refresh_token_days', 14)),
                'last_used_at' => now(),
                'ip_address' => $request->ip(),
                'user_agent' => mb_substr((string) $request->userAgent(), 0, 1000),
            ]);

            return self::response($token->fresh(), $plainAccessToken, $plainRefreshToken);
        });
    }

    private static function response(ApiToken $token, string $accessToken, string $refreshToken): array
    {
        return [
            'token_type' => 'Bearer',
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_at' => $token->expires_at->toIso8601String(),
            'refresh_expires_at' => $token->refresh_expires_at->toIso8601String(),
        ];
    }
}
