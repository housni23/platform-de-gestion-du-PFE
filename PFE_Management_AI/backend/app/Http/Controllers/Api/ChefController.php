<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\JuryMember;
use App\Models\Notification;
use App\Models\Pfe;
use App\Models\PfeModificationRequest;
use App\Models\Soutenance;
use App\Models\User;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChefController extends Controller
{
    public function getDashboard(Request $request): JsonResponse
    {
        $chef = $request->user();
        if (!$chef->filiere_id) {
            return response()->json(['message' => 'Aucune filière n’est affectée à ce responsable.'], 409);
        }

        $pfes = Pfe::with([
            'student:id,first_name,last_name,email',
            'academicSupervisor:id,first_name,last_name,email',
            'filiere', 'entreprise', 'milestones',
        ])->where('filiere_id', $chef->filiere_id)->get();

        $supervisors = User::whereHas('role', fn ($query) => $query->where('name', 'Encadrant'))
            ->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('filiere_id')->orWhere('filiere_id', $chef->filiere_id))
            ->withCount('supervisedPfes')->get();

        $defenses = Soutenance::with(['pfe.student:id,first_name,last_name', 'juryMembers.user:id,first_name,last_name'])
            ->whereHas('pfe', fn ($query) => $query->where('filiere_id', $chef->filiere_id))
            ->orderBy('date')->get();

        $modificationRequests = PfeModificationRequest::with([
            'pfe:id,title,student_id,academic_supervisor_id,filiere_id',
            'pfe.student:id,first_name,last_name',
            'requester:id,first_name,last_name',
        ])->where('status', 'En attente')
            ->whereHas('pfe', fn ($query) => $query->where('filiere_id', $chef->filiere_id))
            ->latest()->get();

        $pfeRows = $pfes->map(fn (Pfe $pfe) => [
            'id' => $pfe->id,
            'student' => $pfe->student->first_name.' '.$pfe->student->last_name,
            'project' => $pfe->title,
            'supervisor' => $pfe->academicSupervisor
                ? $pfe->academicSupervisor->first_name.' '.$pfe->academicSupervisor->last_name
                : 'Non affecté',
            'dept' => $pfe->filiere?->code,
            'progress' => $pfe->progressPercentage(),
            'status' => $pfe->status,
            'company' => $pfe->entreprise?->name,
        ]);

        return response()->json([
            'chef' => $this->basicUser($chef),
            'filiere' => $chef->filiere,
            'pfes' => $pfeRows,
            'validations' => $pfeRows->where('status', 'Validé encadrant')->values(),
            'supervisor_loads' => $supervisors->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->first_name.' '.$user->last_name,
                'count' => $user->supervised_pfes_count,
                'max' => 6,
            ]),
            'defenses' => $defenses,
            'modification_requests' => $modificationRequests,
            'kpis' => [
                'total_pfes' => $pfes->count(),
                'in_progress' => $pfes->whereIn('status', ['Validé', 'Validé encadrant'])->count(),
                'delayed' => $pfeRows->where('progress', '<', 40)->count(),
                'pending_validations' => $pfes->where('status', 'Validé encadrant')->count() + $modificationRequests->count(),
                'scheduled_defenses' => $defenses->count(),
            ],
        ]);
    }

    public function finalValidate(Request $request, int $pfeId): JsonResponse
    {
        $pfe = $this->departmentPfe($request, $pfeId);
        if ($pfe->status !== 'Validé encadrant') {
            return response()->json(['message' => 'Le sujet doit d’abord être validé par l’encadrant.'], 409);
        }
        $data = $request->validate([
            'status' => ['required', Rule::in(['Validé', 'Refusé', 'Modifications demandées'])],
            'comments' => ['nullable', 'string', 'max:5000'],
        ]);
        if ($data['status'] !== 'Validé' && empty($data['comments'])) {
            return response()->json(['message' => 'Un motif est obligatoire.'], 422);
        }

        $pfe->update([
            'status' => $data['status'],
            'refusal_reason' => $data['status'] === 'Validé' ? null : $data['comments'],
            'final_validated_at' => $data['status'] === 'Validé' ? now() : null,
        ]);
        Notification::create([
            'user_id' => $pfe->student_id,
            'title' => 'Validation finale du sujet',
            'type' => 'workflow',
            'content' => $data['status'].(!empty($data['comments']) ? ' — '.$data['comments'] : ''),
            'action_url' => '/student/pfe',
        ]);
        AuditService::record($request, 'pfe.department_decision', $pfe, $data);

        return response()->json(['success' => true, 'pfe' => $pfe]);
    }

    public function validateConvention(Request $request, Document $document): JsonResponse
    {
        $document->loadMissing('pfe');
        abort_unless($document->pfe->filiere_id === $request->user()->filiere_id && $document->type === 'Convention', 403);
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
            'title' => 'Convention examinée',
            'type' => 'document',
            'content' => 'Statut : '.$document->status,
            'action_url' => '/student/documents',
        ]);
        AuditService::record($request, 'convention.reviewed', $document, $data);

        return response()->json($document);
    }

    public function assignSupervisor(Request $request, int $pfeId): JsonResponse
    {
        $pfe = $this->departmentPfe($request, $pfeId);
        $data = $request->validate(['supervisor_id' => ['required', 'exists:users,id']]);
        $supervisor = User::whereKey($data['supervisor_id'])
            ->where('is_active', true)
            ->whereHas('role', fn ($query) => $query->where('name', 'Encadrant'))
            ->where(fn ($query) => $query->whereNull('filiere_id')->orWhere('filiere_id', $request->user()->filiere_id))
            ->withCount('supervisedPfes')->first();

        if (!$supervisor) {
            return response()->json(['message' => 'L’utilisateur sélectionné n’est pas un encadrant admissible.'], 422);
        }
        if ($supervisor->supervised_pfes_count >= 6 && $pfe->academic_supervisor_id !== $supervisor->id) {
            return response()->json(['message' => 'Cet encadrant a atteint sa capacité maximale.'], 409);
        }

        $previous = $pfe->academic_supervisor_id;
        $pfe->update(['academic_supervisor_id' => $supervisor->id]);
        Notification::create([
            'user_id' => $supervisor->id,
            'title' => 'Nouveau PFE affecté',
            'type' => 'assignment',
            'content' => $pfe->title,
            'action_url' => '/supervisor/students',
        ]);
        Notification::create([
            'user_id' => $pfe->student_id,
            'title' => 'Encadrant affecté',
            'type' => 'assignment',
            'content' => $supervisor->first_name.' '.$supervisor->last_name,
            'action_url' => '/student/pfe',
        ]);
        AuditService::record($request, 'pfe.supervisor_assigned', $pfe, ['from' => $previous, 'to' => $supervisor->id]);

        return response()->json(['success' => true, 'pfe' => $pfe->load('academicSupervisor')]);
    }

    public function scheduleDefense(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pfe_id' => ['required', 'exists:pfes,id'],
            'date' => ['required', 'date', 'after:now'],
            'room' => ['required', 'string', 'max:120'],
            'duration_minutes' => ['nullable', 'integer', 'min:20', 'max:180'],
            'jury' => ['required', 'array', 'min:3'],
            'jury.*.user_id' => ['required', 'distinct', 'exists:users,id'],
            'jury.*.role' => ['required', Rule::in(['Président', 'Rapporteur', 'Examinateur', 'Encadrant'])],
        ]);
        $pfe = $this->departmentPfe($request, (int) $data['pfe_id']);
        if ($pfe->status !== 'Validé') {
            return response()->json(['message' => 'La soutenance ne peut être planifiée qu’après validation finale du sujet.'], 409);
        }
        if ($pfe->soutenance()->exists()) {
            return response()->json(['message' => 'Une soutenance est déjà planifiée pour ce PFE.'], 409);
        }

        $juryIds = collect($data['jury'])->pluck('user_id');
        $eligibleJuryCount = User::whereIn('id', $juryIds)
            ->where('is_active', true)
            ->whereHas('role', fn ($query) => $query->whereIn('name', ['Encadrant', 'Chef de filiere']))
            ->count();
        if ($eligibleJuryCount !== $juryIds->unique()->count()) {
            return response()->json(['message' => 'Le jury doit être composé d’enseignants ou responsables actifs.'], 422);
        }
        if (!collect($data['jury'])->contains('role', 'Président')) {
            return response()->json(['message' => 'Le jury doit comporter un président.'], 422);
        }

        $start = Carbon::parse($data['date']);
        $duration = (int) ($data['duration_minutes'] ?? 45);
        $windowStart = $start->copy()->subMinutes(179);
        $windowEnd = $start->copy()->addMinutes(179);
        $candidates = Soutenance::with('juryMembers')->whereBetween('date', [$windowStart, $windowEnd])->get();
        foreach ($candidates as $existing) {
            $existingStart = $existing->date;
            $existingEnd = $existingStart->copy()->addMinutes($existing->duration_minutes);
            $newEnd = $start->copy()->addMinutes($duration);
            $overlap = $start->lt($existingEnd) && $newEnd->gt($existingStart);
            if (!$overlap) {
                continue;
            }
            if (mb_strtolower($existing->room) === mb_strtolower($data['room'])) {
                return response()->json(['message' => 'La salle est déjà réservée sur ce créneau.'], 409);
            }
            $existingUsers = $existing->juryMembers->pluck('user_id');
            if (collect($data['jury'])->pluck('user_id')->intersect($existingUsers)->isNotEmpty()) {
                return response()->json(['message' => 'Un membre du jury est déjà mobilisé sur ce créneau.'], 409);
            }
        }

        $soutenance = DB::transaction(function () use ($data, $duration) {
            $soutenance = Soutenance::create([
                'pfe_id' => $data['pfe_id'],
                'date' => $data['date'],
                'room' => $data['room'],
                'duration_minutes' => $duration,
                'status' => 'Planifiée',
            ]);
            foreach ($data['jury'] as $member) {
                JuryMember::create(['soutenance_id' => $soutenance->id, ...$member]);
            }
            return $soutenance;
        });

        $recipientIds = collect($data['jury'])->pluck('user_id')->push($pfe->student_id)->unique();
        $recipientIds->each(fn (int $userId) => Notification::create([
            'user_id' => $userId,
            'title' => 'Soutenance planifiée',
            'type' => 'defense',
            'content' => $start->format('d/m/Y H:i').' — '.$data['room'],
            'action_url' => '/defenses/'.$soutenance->id,
        ]));
        AuditService::record($request, 'defense.scheduled', $soutenance, ['jury' => $data['jury']]);

        return response()->json($soutenance->load(['pfe.student', 'juryMembers.user']), 201);
    }

    public function exportPfeCsv(Request $request): StreamedResponse
    {
        $chef = $request->user();
        $fileName = 'pfes-'.$chef->filiere?->code.'-'.now()->format('Ymd').'.csv';
        $rows = Pfe::with(['student', 'academicSupervisor', 'entreprise'])
            ->where('filiere_id', $chef->filiere_id)->orderBy('status')->get();
        AuditService::record($request, 'pfe.exported.csv', $chef->filiere);

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Étudiant', 'Email', 'Sujet', 'Entreprise', 'Encadrant', 'Statut', 'Progression'], ';');
            foreach ($rows as $pfe) {
                fputcsv($out, [
                    $pfe->student->first_name.' '.$pfe->student->last_name,
                    $pfe->student->email,
                    $pfe->title,
                    $pfe->entreprise?->name,
                    $pfe->academicSupervisor ? $pfe->academicSupervisor->first_name.' '.$pfe->academicSupervisor->last_name : '',
                    $pfe->status,
                    $pfe->progressPercentage().'%',
                ], ';');
            }
            fclose($out);
        }, $fileName, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function departmentPfe(Request $request, int $pfeId): Pfe
    {
        return Pfe::where('filiere_id', $request->user()->filiere_id)->findOrFail($pfeId);
    }

    private function basicUser($user): array
    {
        return ['id' => $user->id, 'first_name' => $user->first_name, 'last_name' => $user->last_name, 'email' => $user->email];
    }
}
