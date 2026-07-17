<?php

namespace Tests\Feature;

use App\Models\AnneeAcademique;
use App\Models\ApiToken;
use App\Models\Entreprise;
use App\Models\Filiere;
use App\Models\Pfe;
use App\Models\PfeModificationRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PfeModificationRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_request_reopening_of_a_validated_pfe_only_once(): void
    {
        [$student, $supervisor, , $pfe] = $this->scenario();

        $token = $this->tokenFor($student);

        $response = $this->withToken($token)->postJson('/api/student/pfe/modification-request', [
            'reason' => 'Je dois corriger le titre et les informations de l’entreprise d’accueil.',
        ])->assertCreated()->assertJsonPath('status', 'En attente');

        $this->assertDatabaseHas('pfe_modification_requests', [
            'id' => $response->json('id'),
            'pfe_id' => $pfe->id,
            'requested_by' => $student->id,
            'status' => 'En attente',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $supervisor->id,
            'title' => 'Demande de modification PFE',
        ]);

        $this->withToken($token)->postJson('/api/student/pfe/modification-request', [
            'reason' => 'Une deuxième demande ne doit pas être créée pendant que la première est en attente.',
        ])->assertConflict();
    }

    public function test_supervisor_can_approve_assigned_students_request_and_reopen_the_pfe(): void
    {
        [$student, $supervisor, , $pfe] = $this->scenario();
        $modificationRequest = PfeModificationRequest::create([
            'pfe_id' => $pfe->id,
            'requested_by' => $student->id,
            'reason' => 'Le nom de l’entreprise et la période doivent être corrigés.',
            'status' => 'En attente',
        ]);

        $this->withToken($this->tokenFor($supervisor))->postJson(
            "/api/supervisor/modification-requests/{$modificationRequest->id}/decision",
            ['decision' => 'Approuvée', 'decision_note' => 'Corrigez uniquement les champs indiqués.']
        )->assertOk()->assertJsonPath('status', 'Approuvée');

        $this->assertDatabaseHas('pfes', [
            'id' => $pfe->id,
            'status' => 'Modifications demandées',
            'submitted_at' => null,
            'subject_validated_at' => null,
            'final_validated_at' => null,
        ]);
        $this->assertDatabaseHas('pfe_modification_requests', [
            'id' => $modificationRequest->id,
            'status' => 'Approuvée',
            'decided_by' => $supervisor->id,
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $student->id,
            'title' => 'Modification du PFE autorisée',
        ]);
    }

    public function test_unrelated_supervisor_cannot_decide_the_request(): void
    {
        [$student, , , $pfe, $supervisorRole] = $this->scenario();
        $otherSupervisor = User::create([
            'first_name' => 'Nora', 'last_name' => 'Autre', 'email' => 'nora.autre@uca.ma',
            'role_id' => $supervisorRole->id, 'is_active' => true,
        ]);
        $modificationRequest = PfeModificationRequest::create([
            'pfe_id' => $pfe->id,
            'requested_by' => $student->id,
            'reason' => 'Une correction est nécessaire sur la fiche validée.',
            'status' => 'En attente',
        ]);

        $this->withToken($this->tokenFor($otherSupervisor))->postJson(
            "/api/supervisor/modification-requests/{$modificationRequest->id}/decision",
            ['decision' => 'Approuvée']
        )->assertForbidden();

        $this->assertDatabaseHas('pfe_modification_requests', [
            'id' => $modificationRequest->id,
            'status' => 'En attente',
        ]);
    }

    public function test_admin_can_reject_a_request_without_changing_the_validated_pfe(): void
    {
        [$student, , $admin, $pfe] = $this->scenario();
        $modificationRequest = PfeModificationRequest::create([
            'pfe_id' => $pfe->id,
            'requested_by' => $student->id,
            'reason' => 'Je souhaite remplacer complètement le sujet déjà validé.',
            'status' => 'En attente',
        ]);

        $this->withToken($this->tokenFor($admin))->postJson(
            "/api/admin/modification-requests/{$modificationRequest->id}/decision",
            ['decision' => 'Rejetée', 'decision_note' => 'Un changement complet de sujet exige une nouvelle procédure.']
        )->assertOk()->assertJsonPath('status', 'Rejetée');

        $this->assertDatabaseHas('pfes', ['id' => $pfe->id, 'status' => 'Validé']);
        $this->assertDatabaseHas('pfe_modification_requests', [
            'id' => $modificationRequest->id,
            'status' => 'Rejetée',
            'decided_by' => $admin->id,
        ]);
    }

    private function scenario(): array
    {
        $studentRole = Role::create(['name' => 'Etudiant']);
        $supervisorRole = Role::create(['name' => 'Encadrant']);
        $adminRole = Role::create(['name' => 'Super Admin']);
        $filiere = Filiere::create(['name' => 'Intelligence Artificielle et Data Science', 'code' => 'IADS']);
        $year = AnneeAcademique::create(['label' => '2026–2027', 'start_date' => '2026-09-01', 'end_date' => '2027-07-15']);
        $company = Entreprise::create(['name' => 'OCP Group']);
        $supervisor = User::create([
            'first_name' => 'Salma', 'last_name' => 'Idrissi', 'email' => 'salma.idrissi@uca.ma',
            'role_id' => $supervisorRole->id, 'filiere_id' => $filiere->id, 'is_active' => true,
        ]);
        $student = User::create([
            'first_name' => 'Ahmed', 'last_name' => 'Benali', 'email' => 'ahmed.benali@edu.uca.ma',
            'role_id' => $studentRole->id, 'filiere_id' => $filiere->id, 'is_active' => true,
        ]);
        $admin = User::create([
            'first_name' => 'Admin', 'last_name' => 'ENSA', 'email' => 'admin@uca.ma',
            'role_id' => $adminRole->id, 'is_active' => true,
        ]);
        $pfe = Pfe::create([
            'title' => 'Système intelligent de prévision des stocks',
            'status' => 'Validé',
            'student_id' => $student->id,
            'academic_supervisor_id' => $supervisor->id,
            'entreprise_id' => $company->id,
            'filiere_id' => $filiere->id,
            'academic_year_id' => $year->id,
            'submitted_at' => now()->subDays(10),
            'subject_validated_at' => now()->subDays(8),
            'final_validated_at' => now()->subDays(5),
        ]);

        return [$student, $supervisor, $admin, $pfe, $supervisorRole];
    }

    private function tokenFor(User $user): string
    {
        $plain = 'test-token-'.str_repeat('x', 70).$user->id.'-'.uniqid();
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
