<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class GeminiService
{
    public function configured(): bool
    {
        return filled(config('services.gemini.api_key'));
    }

    public function model(): string
    {
        return (string) config('services.gemini.model');
    }

    public function generate(string $instructions, array $messages, ?Document $document = null): array
    {
        if (!$this->configured()) {
            throw new RuntimeException('L’assistant IA n’est pas encore configuré. Ajoutez GEMINI_API_KEY dans backend/.env.');
        }

        $contents = collect($messages)->map(fn (array $message) => [
            'role' => ($message['role'] ?? 'user') === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => (string) ($message['content'] ?? '')]],
        ])->values()->all();

        if ($document) {
            $this->attachDocumentToLastUserMessage($contents, $document);
        }

        $payload = [
            'systemInstruction' => [
                'parts' => [['text' => $instructions]],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'maxOutputTokens' => (int) config('services.gemini.max_output_tokens', 1800),
                'temperature' => (float) config('services.gemini.temperature', 0.3),
            ],
        ];

        $endpoint = sprintf(
            '%s/models/%s:generateContent',
            rtrim((string) config('services.gemini.base_url'), '/'),
            rawurlencode($this->model()),
        );

        $response = Http::withHeaders([
            'x-goog-api-key' => (string) config('services.gemini.api_key'),
        ])
            ->acceptJson()
            ->asJson()
            ->connectTimeout(10)
            ->timeout((int) config('services.gemini.timeout_seconds', 90))
            ->post($endpoint, $payload);

        if (!$response->successful()) {
            $message = match ($response->status()) {
                400 => 'La requête Gemini a été refusée. Vérifiez la clé, le modèle et le format du document.',
                401, 403 => 'La clé Gemini est invalide, inactive ou non autorisée.',
                404 => 'Le modèle Gemini configuré est introuvable ou indisponible pour ce compte.',
                429 => 'La limite gratuite ou le quota Gemini est atteint. Réessayez plus tard.',
                default => 'Le service Gemini est temporairement indisponible.',
            };
            throw new RuntimeException($message);
        }

        $body = $response->json();
        $text = collect(data_get($body, 'candidates.0.content.parts', []))
            ->pluck('text')
            ->filter(fn ($part) => is_string($part) && trim($part) !== '')
            ->implode("\n\n");

        if ($text === '') {
            $blockReason = data_get($body, 'promptFeedback.blockReason');
            $finishReason = data_get($body, 'candidates.0.finishReason');
            if ($blockReason || in_array($finishReason, ['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT'], true)) {
                throw new RuntimeException('Gemini a bloqué cette demande pour des raisons de sécurité. Reformulez-la sans contenu sensible.');
            }

            throw new RuntimeException('Gemini n’a retourné aucun texte exploitable.');
        }

        return [
            'text' => $text,
            'response_id' => $body['responseId'] ?? null,
            'model' => $body['modelVersion'] ?? $this->model(),
            'usage' => $body['usageMetadata'] ?? null,
        ];
    }

    private function attachDocumentToLastUserMessage(array &$contents, Document $document): void
    {
        if (!Storage::disk('local')->exists($document->file_path)) {
            throw new RuntimeException('Le fichier sélectionné est introuvable sur le stockage.');
        }

        $maxBytes = (int) config('services.gemini.document_max_kilobytes', 10240) * 1024;
        $size = Storage::disk('local')->size($document->file_path);
        if ($size > $maxBytes) {
            throw new RuntimeException('Ce document dépasse la taille maximale autorisée pour l’analyse IA.');
        }

        for ($index = count($contents) - 1; $index >= 0; $index--) {
            if (($contents[$index]['role'] ?? null) !== 'user') {
                continue;
            }

            $mime = $document->mime_type ?: 'application/octet-stream';
            $bytes = Storage::disk('local')->get($document->file_path);
            $contents[$index]['parts'][] = [
                'text' => 'Document joint autorisé : '.($document->original_name ?: $document->name),
            ];
            $contents[$index]['parts'][] = [
                'inlineData' => [
                    'mimeType' => $mime,
                    'data' => base64_encode($bytes),
                ],
            ];

            return;
        }
    }
}
