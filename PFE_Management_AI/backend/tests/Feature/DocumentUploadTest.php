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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_uploads_a_real_validated_private_file(): void
    {
        Storage::fake('local');
        $role = Role::create(['name' => 'Etudiant']);
        $filiere = Filiere::create(['name' => 'Génie Informatique', 'code' => 'GI']);
        $year = AnneeAcademique::create(['label' => '2026–2027', 'start_date' => '2026-09-01', 'end_date' => '2027-07-15']);
        $company = Entreprise::create(['name' => 'UCA Digital Lab']);
        $student = User::create(['first_name' => 'Aya', 'last_name' => 'Amrani', 'email' => 'aya@edu.uca.ma', 'role_id' => $role->id, 'is_active' => true]);
        $pfe = Pfe::create([
            'title' => 'PFE test', 'status' => 'Validé', 'student_id' => $student->id,
            'entreprise_id' => $company->id, 'filiere_id' => $filiere->id, 'academic_year_id' => $year->id,
        ]);

        $response = $this->withToken($this->tokenFor($student))->post('/api/student/documents', [
            'file' => UploadedFile::fake()->create('rapport.pdf', 256, 'application/pdf'),
            'type' => 'Rapport',
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('version', 1)
            ->assertJsonPath('name', 'rapport');
        $path = $response->json('file_path');
        Storage::disk('local')->assertExists($path);
        $this->assertDatabaseHas('documents', ['pfe_id' => $pfe->id, 'type' => 'Rapport', 'status' => 'En attente']);
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
