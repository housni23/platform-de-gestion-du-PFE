<?php

namespace Tests\Feature;

use App\Models\AnneeAcademique;
use App\Models\ApiToken;
use App\Models\Entreprise;
use App\Models\Filiere;
use App\Models\Pfe;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_supervisor_cannot_validate_another_supervisors_pfe(): void
    {
        [$supervisorA, $supervisorB, $student, $pfe] = $this->scenario();
        $this->assertNotSame($supervisorA->id, $supervisorB->id);

        $this->withToken($this->tokenFor($supervisorB))->postJson(
            "/api/supervisor/pfes/{$pfe->id}/subject-decision",
            ['status' => 'Validé encadrant']
        )->assertNotFound();

        $this->withToken($this->tokenFor($supervisorA))->postJson(
            "/api/supervisor/pfes/{$pfe->id}/subject-decision",
            ['status' => 'Validé encadrant']
        )->assertOk();

        $this->assertDatabaseHas('pfes', ['id' => $pfe->id, 'student_id' => $student->id, 'status' => 'Validé encadrant']);
    }

    public function test_identity_header_no_longer_bypasses_authentication(): void
    {
        [, , $student] = $this->scenario();
        $this->withHeader('X-User-Id', (string) $student->id)
            ->getJson('/api/student/dashboard')
            ->assertUnauthorized();
    }

    private function scenario(): array
    {
        $studentRole = Role::create(['name' => 'Etudiant']);
        $supervisorRole = Role::create(['name' => 'Encadrant']);
        $filiere = Filiere::create(['name' => 'Génie Informatique', 'code' => 'GI']);
        $year = AnneeAcademique::create(['label' => '2026–2027', 'start_date' => '2026-09-01', 'end_date' => '2027-07-15']);
        $company = Entreprise::create(['name' => 'UCA Digital Lab']);
        $supervisorA = User::create(['first_name' => 'Ali', 'last_name' => 'A', 'email' => 'ali.a@uca.ma', 'role_id' => $supervisorRole->id, 'is_active' => true]);
        $supervisorB = User::create(['first_name' => 'Ali', 'last_name' => 'B', 'email' => 'ali.b@uca.ma', 'role_id' => $supervisorRole->id, 'is_active' => true]);
        $student = User::create(['first_name' => 'Aya', 'last_name' => 'Amrani', 'email' => 'aya@edu.uca.ma', 'role_id' => $studentRole->id, 'is_active' => true]);
        $pfe = Pfe::create([
            'title' => 'PFE test', 'status' => 'Soumis', 'student_id' => $student->id,
            'academic_supervisor_id' => $supervisorA->id, 'entreprise_id' => $company->id,
            'filiere_id' => $filiere->id, 'academic_year_id' => $year->id,
        ]);
        return [$supervisorA, $supervisorB, $student, $pfe];
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
