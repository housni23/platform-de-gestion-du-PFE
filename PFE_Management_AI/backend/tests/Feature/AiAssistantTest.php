<?php

namespace Tests\Feature;

use App\Models\AiConversation;
use App\Models\ApiToken;
use App\Models\Document;
use App\Models\Pfe;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AiAssistantTest extends TestCase
{
    use RefreshDatabase;

    public function test_ai_routes_require_authentication(): void
    {
        $this->getJson('/api/ai/bootstrap')->assertUnauthorized();
        $this->postJson('/api/ai/chat', [
            'message' => 'Bonjour',
            'mode' => 'chat',
        ])->assertUnauthorized();
    }

    public function test_bootstrap_only_lists_documents_authorized_for_the_student(): void
    {
        $role = Role::create(['name' => 'Etudiant']);
        $student = $this->user($role, 'student@edu.uca.ma');
        $other = $this->user($role, 'other@edu.uca.ma');
        $ownPfe = Pfe::create(['title' => 'Mon PFE', 'status' => 'Brouillon', 'student_id' => $student->id]);
        $otherPfe = Pfe::create(['title' => 'Autre PFE', 'status' => 'Brouillon', 'student_id' => $other->id]);
        $ownDocument = Document::create([
            'pfe_id' => $ownPfe->id, 'uploaded_by' => $student->id, 'name' => 'Mon rapport',
            'original_name' => 'rapport.pdf', 'file_path' => 'private/rapport.pdf', 'mime_type' => 'application/pdf',
            'type' => 'Rapport', 'version' => 1,
        ]);
        Document::create([
            'pfe_id' => $otherPfe->id, 'uploaded_by' => $other->id, 'name' => 'Rapport privé',
            'original_name' => 'prive.pdf', 'file_path' => 'private/prive.pdf', 'mime_type' => 'application/pdf',
            'type' => 'Rapport', 'version' => 1,
        ]);

        $response = $this->withToken($this->tokenFor($student))->getJson('/api/ai/bootstrap')->assertOk();

        $this->assertSame([$ownDocument->id], collect($response->json('documents'))->pluck('id')->all());
    }

    public function test_chat_returns_clear_error_when_gemini_is_not_configured(): void
    {
        config(['services.gemini.api_key' => null]);
        $role = Role::create(['name' => 'Etudiant']);
        $student = $this->user($role, 'student@edu.uca.ma');

        $this->withToken($this->tokenFor($student))->postJson('/api/ai/chat', [
            'message' => 'Analyse mon avancement',
            'mode' => 'chat',
        ])->assertStatus(503)->assertJsonFragment(['message' => 'L’assistant IA n’est pas configuré. Ajoutez GEMINI_API_KEY dans backend/.env puis exécutez php artisan config:clear.']);
    }

    public function test_authenticated_user_can_create_a_persisted_ai_conversation(): void
    {
        config([
            'services.gemini.api_key' => 'test-secret-key',
            'services.gemini.base_url' => 'https://gemini.test/v1beta',
            'services.gemini.model' => 'gemini-test',
        ]);
        Http::fake([
            'https://gemini.test/v1beta/models/gemini-test:generateContent' => Http::response([
                'responseId' => 'resp_test_123',
                'modelVersion' => 'gemini-test',
                'candidates' => [[
                    'content' => ['role' => 'model', 'parts' => [['text' => 'Voici vos trois priorités.']]],
                    'finishReason' => 'STOP',
                ]],
                'usageMetadata' => ['promptTokenCount' => 100, 'candidatesTokenCount' => 20, 'totalTokenCount' => 120],
            ]),
        ]);
        $role = Role::create(['name' => 'Etudiant']);
        $student = $this->user($role, 'student@edu.uca.ma');

        $response = $this->withToken($this->tokenFor($student))->postJson('/api/ai/chat', [
            'message' => 'Analyse mon avancement',
            'mode' => 'chat',
        ])->assertOk()->assertJsonPath('message.content', 'Voici vos trois priorités.');

        $conversation = AiConversation::findOrFail($response->json('conversation.id'));
        $this->assertSame($student->id, $conversation->user_id);
        $this->assertSame(['user', 'assistant'], $conversation->messages()->oldest()->pluck('role')->all());
        $this->assertDatabaseHas('audit_logs', ['user_id' => $student->id, 'action' => 'ai.response.generated']);

        Http::assertSent(fn ($request) => $request->url() === 'https://gemini.test/v1beta/models/gemini-test:generateContent'
            && $request->hasHeader('x-goog-api-key', 'test-secret-key')
            && str_contains($request['systemInstruction']['parts'][0]['text'], 'assistant institutionnel')
            && $request['contents'][0]['role'] === 'user');
    }

    public function test_authorized_pdf_is_sent_inline_to_gemini(): void
    {
        config([
            'services.gemini.api_key' => 'test-secret-key',
            'services.gemini.base_url' => 'https://gemini.test/v1beta',
            'services.gemini.model' => 'gemini-test',
        ]);
        Storage::fake('local');
        Storage::disk('local')->put('private/report.pdf', '%PDF-test-content');
        Http::fake([
            'https://gemini.test/v1beta/models/gemini-test:generateContent' => Http::response([
                'responseId' => 'resp_document_123',
                'modelVersion' => 'gemini-test',
                'candidates' => [['content' => ['parts' => [['text' => 'Résumé du rapport.']]], 'finishReason' => 'STOP']],
                'usageMetadata' => ['totalTokenCount' => 42],
            ]),
        ]);

        $role = Role::create(['name' => 'Etudiant']);
        $student = $this->user($role, 'student@edu.uca.ma');
        $pfe = Pfe::create(['title' => 'Mon PFE', 'status' => 'Brouillon', 'student_id' => $student->id]);
        $document = Document::create([
            'pfe_id' => $pfe->id,
            'uploaded_by' => $student->id,
            'name' => 'Rapport',
            'original_name' => 'rapport.pdf',
            'file_path' => 'private/report.pdf',
            'mime_type' => 'application/pdf',
            'type' => 'Rapport',
            'version' => 1,
        ]);

        $this->withToken($this->tokenFor($student))->postJson('/api/ai/chat', [
            'message' => 'Résume ce document',
            'mode' => 'summarize',
            'document_id' => $document->id,
        ])->assertOk()->assertJsonPath('message.content', 'Résumé du rapport.');

        Http::assertSent(function ($request) {
            $parts = $request['contents'][0]['parts'];
            $inlineData = collect($parts)->first(fn ($part) => isset($part['inlineData']));

            return $inlineData['inlineData']['mimeType'] === 'application/pdf'
                && base64_decode($inlineData['inlineData']['data'], true) === '%PDF-test-content';
        });
    }

    public function test_user_cannot_open_another_users_conversation(): void
    {
        $role = Role::create(['name' => 'Etudiant']);
        $owner = $this->user($role, 'owner@edu.uca.ma');
        $other = $this->user($role, 'other@edu.uca.ma');
        $conversation = AiConversation::create(['user_id' => $owner->id, 'title' => 'Privée', 'mode' => 'chat']);

        $this->withToken($this->tokenFor($other))
            ->getJson('/api/ai/conversations/'.$conversation->id)
            ->assertForbidden();
    }

    private function user(Role $role, string $email): User
    {
        return User::create([
            'first_name' => 'Test', 'last_name' => 'User', 'email' => $email,
            'password' => null, 'role_id' => $role->id, 'is_active' => true,
        ]);
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
