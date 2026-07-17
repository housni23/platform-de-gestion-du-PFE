<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CompteRendu;
use App\Models\Document;
use App\Models\Entreprise;
use App\Models\Filiere;
use App\Models\AnneeAcademique;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Pfe;
use App\Models\PfeMilestone;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentController extends Controller
{
    public function getDashboard(Request $request): JsonResponse
    {
        $student = $request->user();
        $pfe = Pfe::with([
            'academicSupervisor:id,first_name,last_name,email',
            'entreprise', 'filiere', 'academicYear', 'milestones',
            'documents' => fn ($query) => $query->latest(),
            'comptesRendus' => fn ($query) => $query->latest(),
            'soutenance.juryMembers.user:id,first_name,last_name',
            'appointments' => fn ($query) => $query->latest('scheduled_at'),
            'modificationRequests.decider:id,first_name,last_name',
        ])->where('student_id', $student->id)->first();

        $notifications = Notification::where('user_id', $student->id)->latest()->limit(30)->get();
        $progress = $pfe?->progressPercentage() ?? 0;
        $daysLeft = $pfe?->end_date ? max(0, (int) now()->startOfDay()->diffInDays($pfe->end_date, false)) : null;

        return response()->json([
            'student' => $this->basicUser($student),
            'pfe' => $pfe,
            'reports' => $pfe?->comptesRendus ?? [],
            'documents' => $pfe?->documents ?? [],
            'notifications' => $notifications,
            'soutenance' => $pfe?->soutenance,
            'appointments' => $pfe?->appointments ?? [],
            'modification_request' => $pfe?->modificationRequests->first(),
            'references' => [
                'filieres' => Filiere::orderBy('name')->get(['id', 'name', 'code']),
                'academic_years' => AnneeAcademique::orderByDesc('start_date')->get(['id', 'label', 'start_date', 'end_date']),
            ],
            'kpis' => [
                'progress' => $progress,
                'status' => $pfe?->status ?? 'Non créé',
                'reports_count' => $pfe?->comptesRendus->count() ?? 0,
                'days_left' => $daysLeft,
                'defense_date' => $pfe?->soutenance?->date?->toIso8601String(),
                'unread_notifications' => $notifications->where('is_read', false)->count(),
            ],
        ]);
    }

    public function savePfe(Request $request): JsonResponse
    {
        $student = $request->user();
        $pfe = Pfe::where('student_id', $student->id)->first();
        if ($pfe && !in_array($pfe->status, ['Brouillon', 'Refusé', 'Modifications demandées'], true)) {
            return response()->json(['message' => 'Le PFE ne peut plus être modifié dans son état actuel.'], 409);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'filiere_id' => ['required', 'exists:filieres,id'],
            'academic_year_id' => ['required', 'exists:annees_academiques,id'],
            'company.name' => ['required', 'string', 'max:255'],
            'company.sector' => ['nullable', 'string', 'max:150'],
            'company.address' => ['nullable', 'string', 'max:255'],
            'company.city' => ['nullable', 'string', 'max:120'],
            'company.contact_phone' => ['nullable', 'string', 'max:40'],
            'company.supervisor_name' => ['nullable', 'string', 'max:255'],
            'company.supervisor_email' => ['nullable', 'email', 'max:255'],
        ]);

        $pfe = DB::transaction(function () use ($data, $student, $pfe) {
            $company = Entreprise::updateOrCreate(
                ['name' => $data['company']['name'], 'city' => $data['company']['city'] ?? null],
                $data['company']
            );

            $pfe = Pfe::updateOrCreate(
                ['student_id' => $student->id],
                [
                    'title' => $data['title'],
                    'description' => $data['description'] ?? null,
                    'status' => 'Brouillon',
                    'refusal_reason' => null,
                    'start_date' => $data['start_date'] ?? null,
                    'end_date' => $data['end_date'] ?? null,
                    'entreprise_id' => $company->id,
                    'filiere_id' => $data['filiere_id'],
                    'academic_year_id' => $data['academic_year_id'],
                ]
            );

            if (!$pfe->milestones()->exists()) {
                collect(['Cahier des charges', 'Conception', 'Réalisation', 'Rédaction', 'Soutenance'])
                    ->each(fn (string $name, int $position) => PfeMilestone::create([
                        'pfe_id' => $pfe->id,
                        'name' => $name,
                        'position' => $position + 1,
                    ]));
            }

            return $pfe;
        });

        AuditService::record($request, 'pfe.saved', $pfe);

        return response()->json(['success' => true, 'pfe' => $pfe->load(['entreprise', 'filiere', 'academicYear', 'milestones'])]);
    }

    public function submitPfe(Request $request): JsonResponse
    {
        $pfe = $this->studentPfe($request);
        if (!$pfe) {
            return response()->json(['message' => 'Créez d’abord votre fiche PFE.'], 404);
        }
        if (!in_array($pfe->status, ['Brouillon', 'Refusé', 'Modifications demandées'], true)) {
            return response()->json(['message' => 'Ce sujet a déjà été soumis.'], 409);
        }
        if (!$pfe->title || !$pfe->entreprise_id || !$pfe->filiere_id || !$pfe->academic_year_id) {
            return response()->json(['message' => 'La fiche PFE est incomplète.'], 422);
        }

        $pfe->update(['status' => 'Soumis', 'submitted_at' => now(), 'refusal_reason' => null]);
        $this->notifyRole('Encadrant', 'Nouveau sujet PFE', "{$request->user()->first_name} {$request->user()->last_name} a soumis son sujet.", '/supervisor/validations');
        AuditService::record($request, 'pfe.submitted', $pfe);

        return response()->json(['success' => true, 'pfe' => $pfe]);
    }

    public function addReport(Request $request): JsonResponse
    {
        $pfe = $this->studentPfe($request);
        if (!$pfe) {
            return response()->json(['message' => 'Aucun PFE trouvé.'], 404);
        }

        $data = $request->validate([
            'percentage' => ['required', 'integer', 'min:0', 'max:100'],
            'description' => ['required', 'string', 'max:10000'],
            'milestone_id' => ['nullable', Rule::exists('pfe_milestones', 'id')->where('pfe_id', $pfe->id)],
        ]);

        $report = DB::transaction(function () use ($data, $pfe) {
            $report = CompteRendu::create([
                'pfe_id' => $pfe->id,
                'percentage' => $data['percentage'],
                'description' => $data['description'],
            ]);
            if (!empty($data['milestone_id'])) {
                $milestone = PfeMilestone::findOrFail($data['milestone_id']);
                $milestone->update([
                    'progress' => $data['percentage'],
                    'status' => $data['percentage'] >= 100 ? 'Terminé' : ($data['percentage'] > 0 ? 'En cours' : 'À faire'),
                ]);
            }
            return $report;
        });

        if ($pfe->academic_supervisor_id) {
            Notification::create([
                'user_id' => $pfe->academic_supervisor_id,
                'title' => 'Nouveau compte rendu',
                'type' => 'progress',
                'content' => $request->user()->first_name.' a déposé un compte rendu.',
                'action_url' => '/supervisor/students/'.$pfe->id,
            ]);
        }
        AuditService::record($request, 'progress_report.created', $report);

        return response()->json($report, 201);
    }

    public function uploadDocument(Request $request): JsonResponse
    {
        $pfe = $this->studentPfe($request);
        if (!$pfe) {
            return response()->json(['message' => 'Aucun PFE trouvé.'], 404);
        }

        $max = (int) config('pfe.uploads.max_kilobytes');
        $mimes = implode(',', config('pfe.uploads.document_mimes'));
        $data = $request->validate([
            'file' => ['required', 'file', 'max:'.$max, 'mimes:'.$mimes],
            'name' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::in(['Rapport', 'Convention', 'Présentation', 'Livrable', 'Rapport final'])],
        ]);

        $file = $request->file('file');
        $document = DB::transaction(function () use ($file, $data, $pfe, $request) {
            $version = ((int) Document::where('pfe_id', $pfe->id)->where('type', $data['type'])->lockForUpdate()->max('version')) + 1;
            $path = $file->store("pfe-documents/{$pfe->id}", 'local');

            return Document::create([
                'pfe_id' => $pfe->id,
                'uploaded_by' => $request->user()->id,
                'name' => ($data['name'] ?? null) ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'original_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'type' => $data['type'],
                'version' => $version,
                'status' => 'En attente',
            ]);
        });

        if ($pfe->academic_supervisor_id) {
            Notification::create([
                'user_id' => $pfe->academic_supervisor_id,
                'title' => 'Nouveau document',
                'type' => 'document',
                'content' => $document->name.' v'.$document->version.' a été déposé.',
                'action_url' => '/supervisor/documents',
            ]);
        }
        AuditService::record($request, 'document.uploaded', $document, ['type' => $document->type, 'version' => $document->version]);

        return response()->json($document, 201);
    }

    public function downloadDocument(Request $request, Document $document): StreamedResponse|JsonResponse
    {
        $document->loadMissing('pfe');
        $user = $request->user();
        $allowed = $user->roleKey() === 'admin'
            || ($user->roleKey() === 'student' && $document->pfe->student_id === $user->id)
            || ($user->roleKey() === 'supervisor' && $document->pfe->academic_supervisor_id === $user->id)
            || ($user->roleKey() === 'chef' && $document->pfe->filiere_id === $user->filiere_id);

        if (!$allowed) {
            return response()->json(['message' => 'Accès non autorisé à ce document.'], 403);
        }
        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => 'Fichier introuvable sur le stockage.'], 404);
        }

        AuditService::record($request, 'document.downloaded', $document);
        return Storage::disk('local')->download($document->file_path, $document->original_name ?: $document->name);
    }

    public function getMessages(Request $request): JsonResponse
    {
        $pfe = $this->studentPfe($request);
        if (!$pfe) {
            return response()->json(['message' => 'Aucun PFE trouvé.'], 404);
        }

        Message::where('pfe_id', $pfe->id)->where('receiver_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(Message::with(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name'])
            ->where('pfe_id', $pfe->id)->oldest()->get());
    }

    public function sendMessage(Request $request): JsonResponse
    {
        $pfe = $this->studentPfe($request);
        if (!$pfe || !$pfe->academic_supervisor_id) {
            return response()->json(['message' => 'Aucun encadrant n’est affecté à ce PFE.'], 409);
        }
        $data = $request->validate(['message' => ['required', 'string', 'max:5000']]);
        $message = Message::create([
            'pfe_id' => $pfe->id,
            'sender_id' => $request->user()->id,
            'receiver_id' => $pfe->academic_supervisor_id,
            'message' => $data['message'],
        ]);
        Notification::create([
            'user_id' => $pfe->academic_supervisor_id,
            'title' => 'Nouveau message',
            'type' => 'message',
            'content' => $request->user()->first_name.' vous a envoyé un message.',
            'action_url' => '/supervisor/messages/'.$pfe->id,
        ]);

        return response()->json($message, 201);
    }

    public function requestAppointment(Request $request): JsonResponse
    {
        $pfe = $this->studentPfe($request);
        if (!$pfe || !$pfe->academic_supervisor_id) {
            return response()->json(['message' => 'Aucun encadrant n’est affecté à ce PFE.'], 409);
        }
        $data = $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
            'location' => ['nullable', 'string', 'max:255'],
            'agenda' => ['nullable', 'string', 'max:3000'],
        ]);
        $appointment = Appointment::create([
            ...$data,
            'pfe_id' => $pfe->id,
            'requested_by' => $request->user()->id,
            'supervisor_id' => $pfe->academic_supervisor_id,
        ]);
        Notification::create([
            'user_id' => $pfe->academic_supervisor_id,
            'title' => 'Demande de rendez-vous',
            'type' => 'appointment',
            'content' => $request->user()->first_name.' propose un créneau de suivi.',
            'action_url' => '/supervisor/appointments',
        ]);

        return response()->json($appointment, 201);
    }

    public function markNotificationRead(Request $request, Notification $notification): JsonResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->update(['is_read' => true]);
        return response()->json(['success' => true]);
    }

    private function studentPfe(Request $request): ?Pfe
    {
        return Pfe::where('student_id', $request->user()->id)->first();
    }

    private function basicUser($user): array
    {
        return ['id' => $user->id, 'first_name' => $user->first_name, 'last_name' => $user->last_name, 'email' => $user->email];
    }

    private function notifyRole(string $role, string $title, string $content, string $url): void
    {
        \App\Models\User::whereHas('role', fn ($query) => $query->where('name', $role))->each(
            fn ($user) => Notification::create(['user_id' => $user->id, 'title' => $title, 'type' => 'workflow', 'content' => $content, 'action_url' => $url])
        );
    }
}
