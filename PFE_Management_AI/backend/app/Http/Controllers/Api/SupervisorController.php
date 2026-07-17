<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Document;
use App\Models\Evaluation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Pfe;
use App\Models\PfeModificationRequest;
use App\Models\Soutenance;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SupervisorController extends Controller
{
    public function getDashboard(Request $request): JsonResponse
    {
        $supervisor = $request->user();
        $pfes = Pfe::with([
            'student:id,first_name,last_name,email', 'entreprise', 'filiere', 'milestones',
            'documents' => fn ($query) => $query->latest(),
            'comptesRendus' => fn ($query) => $query->latest(),
        ])->where('academic_supervisor_id', $supervisor->id)->get();

        $students = $pfes->map(function (Pfe $pfe) {
            $lastActivity = collect([
                $pfe->documents->max('created_at'),
                $pfe->comptesRendus->max('created_at'),
            ])->filter()->max();

            return [
                'id' => $pfe->student->id,
                'pfe_id' => $pfe->id,
                'name' => $pfe->student->first_name.' '.$pfe->student->last_name,
                'project' => $pfe->title,
                'progress' => $pfe->progressPercentage(),
                'status' => $pfe->status,
                'last_submission_at' => $lastActivity?->toIso8601String(),
                'inactive_days' => $lastActivity ? (int) $lastActivity->diffInDays(now()) : null,
                'alert' => !$lastActivity || $lastActivity->lt(now()->subDays(30)),
            ];
        });

        $documents = Document::with('pfe.student:id,first_name,last_name')
            ->whereIn('pfe_id', $pfes->pluck('id'))
            ->latest()->limit(50)->get();

        $appointments = Appointment::with('pfe.student:id,first_name,last_name')
            ->where('supervisor_id', $supervisor->id)->latest('scheduled_at')->get();

        $defenses = Soutenance::with(['pfe.student:id,first_name,last_name', 'evaluations'])
            ->whereHas('juryMembers', fn ($query) => $query->where('user_id', $supervisor->id))
            ->orderBy('date')->get();

        $modificationRequests = PfeModificationRequest::with([
            'pfe:id,title,student_id,academic_supervisor_id,filiere_id',
            'pfe.student:id,first_name,last_name',
            'requester:id,first_name,last_name',
        ])->where('status', 'En attente')
            ->whereHas('pfe', fn ($query) => $query->where('academic_supervisor_id', $supervisor->id))
            ->latest()->get();

        return response()->json([
            'supervisor' => $this->basicUser($supervisor),
            'students' => $students,
            'subject_validations' => $pfes->where('status', 'Soumis')->values(),
            'documents_review' => $documents,
            'appointments' => $appointments,
            'defenses' => $defenses,
            'modification_requests' => $modificationRequests,
            'alerts' => $students->where('alert', true)->values(),
            'kpis' => [
                'students_count' => $pfes->count(),
                'average_progress' => $students->count() ? (int) round($students->avg('progress')) : 0,
                'pending_validations' => $pfes->where('status', 'Soumis')->count() + $modificationRequests->count(),
                'pending_documents' => $documents->where('status', 'En attente')->count(),
                'alerts_count' => $students->where('alert', true)->count(),
            ],
        ]);
    }

    public function validateSubject(Request $request, int $pfeId): JsonResponse
    {
        $pfe = Pfe::where('academic_supervisor_id', $request->user()->id)->findOrFail($pfeId);
        $data = $request->validate([
            'status' => ['required', Rule::in(['Validé encadrant', 'Refusé', 'Modifications demandées'])],
            'comments' => ['nullable', 'string', 'max:5000'],
        ]);
        if ($pfe->status !== 'Soumis') {
            return response()->json(['message' => 'Seul un sujet soumis peut être examiné.'], 409);
        }
        if ($data['status'] !== 'Validé encadrant' && empty($data['comments'])) {
            return response()->json(['message' => 'Un motif est obligatoire pour un refus ou une demande de modification.'], 422);
        }

        $pfe->update([
            'status' => $data['status'],
            'refusal_reason' => $data['status'] === 'Validé encadrant' ? null : $data['comments'],
            'subject_validated_at' => $data['status'] === 'Validé encadrant' ? now() : null,
        ]);
        Notification::create([
            'user_id' => $pfe->student_id,
            'title' => 'Décision sur votre sujet',
            'type' => 'workflow',
            'content' => $data['status'].(!empty($data['comments']) ? ' — '.$data['comments'] : ''),
            'action_url' => '/student/pfe',
        ]);
        AuditService::record($request, 'pfe.supervisor_decision', $pfe, ['status' => $data['status'], 'comments' => $data['comments'] ?? null]);

        return response()->json(['success' => true, 'pfe' => $pfe]);
    }

    public function reviewDocument(Request $request, Document $document): JsonResponse
    {
        $document->loadMissing('pfe');
        abort_unless($document->pfe->academic_supervisor_id === $request->user()->id, 403);
        $data = $request->validate([
            'status' => ['required', Rule::in(['Validé', 'Refusé', 'Modifications demandées'])],
            'comments' => ['nullable', 'string', 'max:5000'],
        ]);
        if ($data['status'] !== 'Validé' && empty($data['comments'])) {
            return response()->json(['message' => 'Un commentaire est obligatoire.'], 422);
        }

        $document->update($data);
        Notification::create([
            'user_id' => $document->pfe->student_id,
            'title' => 'Document examiné',
            'type' => 'document',
            'content' => "{$document->name} v{$document->version} : {$document->status}",
            'action_url' => '/student/documents',
        ]);
        AuditService::record($request, 'document.reviewed', $document, $data);

        return response()->json(['success' => true, 'document' => $document]);
    }

    public function getMessages(Request $request, int $pfeId): JsonResponse
    {
        $pfe = Pfe::where('academic_supervisor_id', $request->user()->id)->findOrFail($pfeId);
        Message::where('pfe_id', $pfe->id)->where('receiver_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(Message::with(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name'])
            ->where('pfe_id', $pfe->id)->oldest()->get());
    }

    public function sendMessage(Request $request, int $pfeId): JsonResponse
    {
        $pfe = Pfe::where('academic_supervisor_id', $request->user()->id)->findOrFail($pfeId);
        $data = $request->validate(['message' => ['required', 'string', 'max:5000']]);
        $message = Message::create([
            'pfe_id' => $pfe->id,
            'sender_id' => $request->user()->id,
            'receiver_id' => $pfe->student_id,
            'message' => $data['message'],
        ]);
        Notification::create([
            'user_id' => $pfe->student_id,
            'title' => 'Nouveau message de votre encadrant',
            'type' => 'message',
            'content' => $request->user()->first_name.' vous a envoyé un message.',
            'action_url' => '/student/supervision',
        ]);

        return response()->json($message, 201);
    }

    public function respondAppointment(Request $request, Appointment $appointment): JsonResponse
    {
        abort_unless($appointment->supervisor_id === $request->user()->id, 403);
        $data = $request->validate([
            'status' => ['required', Rule::in(['Confirmé', 'Refusé', 'Reporté'])],
            'scheduled_at' => ['nullable', 'required_if:status,Reporté', 'date', 'after:now'],
            'location' => ['nullable', 'string', 'max:255'],
            'response' => ['nullable', 'string', 'max:3000'],
        ]);
        $appointment->update(array_filter($data, fn ($value) => $value !== null));
        Notification::create([
            'user_id' => $appointment->requested_by,
            'title' => 'Réponse à votre rendez-vous',
            'type' => 'appointment',
            'content' => 'Statut : '.$appointment->status,
            'action_url' => '/student/supervision',
        ]);
        AuditService::record($request, 'appointment.responded', $appointment, ['status' => $appointment->status]);

        return response()->json($appointment);
    }

    public function submitEvaluation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'soutenance_id' => ['required', 'exists:soutenances,id'],
            'score' => ['required', 'numeric', 'min:0', 'max:20'],
            'comments' => ['nullable', 'string', 'max:5000'],
        ]);
        $soutenance = Soutenance::with('juryMembers')->findOrFail($data['soutenance_id']);
        $isJuryMember = $soutenance->juryMembers->contains('user_id', $request->user()->id);
        if (!$isJuryMember) {
            return response()->json(['message' => 'Seuls les membres du jury peuvent évaluer cette soutenance.'], 403);
        }

        $evaluation = DB::transaction(fn () => Evaluation::updateOrCreate(
            ['soutenance_id' => $soutenance->id, 'evaluator_id' => $request->user()->id],
            ['score' => $data['score'], 'comments' => $data['comments'] ?? null]
        ));
        AuditService::record($request, 'evaluation.submitted', $evaluation, ['score' => $evaluation->score]);

        return response()->json($evaluation, 201);
    }

    private function basicUser($user): array
    {
        return ['id' => $user->id, 'first_name' => $user->first_name, 'last_name' => $user->last_name, 'email' => $user->email];
    }
}
