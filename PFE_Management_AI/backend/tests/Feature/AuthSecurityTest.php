<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_protected_routes_reject_anonymous_requests(): void
    {
        $this->getJson('/api/student/dashboard')->assertUnauthorized();
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
    }

    public function test_local_login_verifies_password_and_returns_expiring_tokens(): void
    {
        config(['pfe.auth.local_login_enabled' => true]);
        $role = Role::create(['name' => 'Etudiant']);
        User::create([
            'first_name' => 'Aya', 'last_name' => 'Amrani', 'email' => 'aya@edu.uca.ma',
            'password' => Hash::make('StrongPassword!2026'), 'role_id' => $role->id, 'is_active' => true,
        ]);

        $this->postJson('/api/auth/login', ['email' => 'aya@edu.uca.ma', 'password' => 'wrong-password'])
            ->assertUnauthorized();

        $response = $this->postJson('/api/auth/login', [
            'email' => 'aya@edu.uca.ma', 'password' => 'StrongPassword!2026',
        ])->assertOk()->assertJsonPath('role', 'student');

        $response->assertJsonStructure(['access_token', 'refresh_token', 'expires_at', 'refresh_expires_at', 'user']);
        $this->assertDatabaseCount('api_tokens', 1);
        $this->assertNotSame($response->json('access_token'), ApiToken::first()->access_token_hash);
    }

    public function test_disabled_account_cannot_log_in(): void
    {
        config(['pfe.auth.local_login_enabled' => true]);
        $role = Role::create(['name' => 'Etudiant']);
        User::create([
            'first_name' => 'Aya', 'last_name' => 'Amrani', 'email' => 'disabled@edu.uca.ma',
            'password' => Hash::make('StrongPassword!2026'), 'role_id' => $role->id, 'is_active' => false,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'disabled@edu.uca.ma', 'password' => 'StrongPassword!2026',
        ])->assertForbidden();
    }

    public function test_rbac_prevents_student_from_using_admin_routes(): void
    {
        $role = Role::create(['name' => 'Etudiant']);
        $user = User::create([
            'first_name' => 'Aya', 'last_name' => 'Amrani', 'email' => 'aya@edu.uca.ma',
            'password' => null, 'role_id' => $role->id, 'is_active' => true,
        ]);

        $this->withToken($this->tokenFor($user))->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_account_without_a_recognized_role_fails_closed(): void
    {
        config(['pfe.auth.local_login_enabled' => true]);
        User::create([
            'first_name' => 'Aya', 'last_name' => 'Amrani', 'email' => 'no-role@edu.uca.ma',
            'password' => Hash::make('StrongPassword!2026'), 'is_active' => true,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'no-role@edu.uca.ma', 'password' => 'StrongPassword!2026',
        ])->assertForbidden();
    }

    private function tokenFor(User $user): string
    {
        $plain = 'test-token-'.str_repeat('x', 70).$user->id;
        ApiToken::create([
            'user_id' => $user->id,
            'access_token_hash' => hash('sha256', $plain),
            'refresh_token_hash' => hash('sha256', 'refresh-'.$plain),
            'expires_at' => now()->addHour(),
            'refresh_expires_at' => now()->addWeek(),
        ]);
        return $plain;
    }
}
