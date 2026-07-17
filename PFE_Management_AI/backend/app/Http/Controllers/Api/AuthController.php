<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use App\Services\TokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        if (!app()->environment(['local', 'testing']) || !config('pfe.auth.local_login_enabled')) {
            return response()->json([
                'message' => 'La connexion locale est désactivée. Utilisez Google institutionnel.',
            ], 403);
        }

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with(['role', 'filiere'])->where('email', strtolower($credentials['email']))->first();

        if (!$user || !$user->password || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Ce compte est désactivé.'], 403);
        }
        if ($user->roleKey() === 'unknown') {
            return response()->json(['message' => 'Aucun rôle valide n’est attribué à ce compte.'], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $request->setUserResolver(fn () => $user);
        AuditService::record($request, 'auth.login.local', $user);

        return response()->json($this->authenticationPayload($user, TokenService::issue($user, $request)));
    }

    public function googleUrl(Request $request): JsonResponse
    {
        if (!config('services.google.client_id') || !config('services.google.redirect')) {
            return response()->json(['message' => 'Google OAuth n’est pas encore configuré.'], 503);
        }

        $state = Str::random(64);
        Cache::put('google_oauth_state:'.hash('sha256', $state), true, now()->addMinutes(10));

        $query = http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => config('services.google.redirect'),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'access_type' => 'offline',
            'prompt' => 'select_account',
        ]);

        return response()->json(['url' => 'https://accounts.google.com/o/oauth2/v2/auth?'.$query]);
    }

    public function googleCallback(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string'],
            'state' => ['required', 'string', 'size:64'],
        ]);

        $stateKey = 'google_oauth_state:'.hash('sha256', $data['state']);
        if (!Cache::pull($stateKey)) {
            return response()->json(['message' => 'État OAuth invalide ou expiré.'], 422);
        }

        try {
            $tokenResponse = Http::asForm()->timeout(10)->post('https://oauth2.googleapis.com/token', [
                'code' => $data['code'],
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => config('services.google.redirect'),
                'grant_type' => 'authorization_code',
            ])->throw()->json();

            $profile = Http::withToken($tokenResponse['access_token'])
                ->timeout(10)
                ->get('https://openidconnect.googleapis.com/v1/userinfo')
                ->throw()
                ->json();
        } catch (Throwable) {
            return response()->json(['message' => 'Google n’a pas pu valider la connexion.'], 502);
        }

        if (!($profile['email_verified'] ?? false) || empty($profile['email'])) {
            return response()->json(['message' => 'L’adresse Google doit être vérifiée.'], 403);
        }

        $email = strtolower($profile['email']);
        if (!$this->isInstitutionalEmail($email)) {
            return response()->json(['message' => 'Utilisez une adresse institutionnelle ENSA/UCA autorisée.'], 403);
        }

        $studentRole = Role::where('name', 'Etudiant')->firstOrFail();
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'first_name' => $profile['given_name'] ?? Str::before($email, '@'),
                'last_name' => $profile['family_name'] ?? '',
                'google_id' => $profile['sub'] ?? null,
                'email_verified_at' => now(),
                'role_id' => $studentRole->id,
                'is_active' => true,
            ]
        );

        if (!$user->is_active) {
            return response()->json(['message' => 'Ce compte est désactivé.'], 403);
        }

        $user->forceFill([
            'google_id' => $profile['sub'] ?? $user->google_id,
            'email_verified_at' => $user->email_verified_at ?? now(),
            'role_id' => $user->role_id ?? $studentRole->id,
            'last_login_at' => now(),
        ])->save();
        $user->load(['role', 'filiere']);

        if ($user->roleKey() === 'unknown') {
            return response()->json(['message' => 'Aucun rôle valide n’est attribué à ce compte.'], 403);
        }

        $request->setUserResolver(fn () => $user);
        AuditService::record($request, 'auth.login.google', $user);

        return response()->json($this->authenticationPayload($user, TokenService::issue($user, $request)));
    }

    public function refresh(Request $request): JsonResponse
    {
        $data = $request->validate(['refresh_token' => ['required', 'string', 'min:64']]);
        $token = ApiToken::with('user.role')
            ->where('refresh_token_hash', hash('sha256', $data['refresh_token']))
            ->whereNull('revoked_at')
            ->first();

        if (!$token || $token->refresh_expires_at->isPast()) {
            return response()->json(['message' => 'Jeton de renouvellement invalide ou expiré.'], 401);
        }

        if (!$token->user?->is_active) {
            return response()->json(['message' => 'Ce compte est désactivé.'], 403);
        }

        return response()->json(TokenService::rotate($token, $request));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userPayload($request->user()->loadMissing(['role', 'filiere']))]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var ApiToken|null $token */
        $token = $request->attributes->get('api_token');
        $token?->update(['revoked_at' => now()]);
        AuditService::record($request, 'auth.logout', $request->user());

        return response()->json(['success' => true, 'message' => 'Déconnecté avec succès.']);
    }

    private function authenticationPayload(User $user, array $tokens): array
    {
        return [
            'success' => true,
            'user' => $this->userPayload($user),
            'role' => $user->roleKey(),
            ...$tokens,
        ];
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'role' => $user->roleKey(),
            'role_label' => $user->role?->name,
            'filiere' => $user->filiere ? ['id' => $user->filiere->id, 'name' => $user->filiere->name, 'code' => $user->filiere->code] : null,
            'locale' => $user->locale,
        ];
    }

    private function isInstitutionalEmail(string $email): bool
    {
        $domain = Str::afterLast($email, '@');

        return collect(config('pfe.institutional_domains'))
            ->contains(fn (string $allowed) => $domain === $allowed || str_ends_with($domain, '.'.$allowed));
    }
}
