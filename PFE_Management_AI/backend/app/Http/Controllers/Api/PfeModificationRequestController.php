<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Pfe;
use App\Models\PfeModificationRequest;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PfeModificationRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        $pfe = Pfe::where('student_id', $request->user()->id)->first();
        if (!$pfe) {
            return response()->json(['message' => 'Aucun PFE trouvé.'], 404);
        }
        if ($pfe->status !== 'Validé') {
            return response()->json(['message' => 'Une demande de modification est possible uniquement pour un PFE validé.'], 409);
        }

        $modificationRequest = DB::transaction(function () use ($request, $data, $pfe) {
            $lockedPfe = Pfe::query()->lockForUpdate()->findOrFail($pfe->id);
            if ($lockedPfe->status !== 'Validé') {
                abort(409, 'Le statut du PFE a changé. Rechargez la page.');
            }
            if (PfeModificationRequest::where('pfe_id', $lockedPfe->id)->where('status', 'En attente')->exists()) {
                abort(409, 'Une demande de modification est déjà en attente.');
            }

            return PfeModificationRequest::create([
                'pfe_id' => $lockedPfe->id,
                'requested_by' => $request->user()->id,
                'reason' => $data['reason'],
                'status' => 'En attente',
            ]);
        });

        $recipientIds = collect([$pfe->academic_supervisor_id])->filter();
        $recipientIds = $recipientIds
            ->merge(User::where('filiere_id', $pfe->filiere_id)
                ->where('is_active', true)
                ->whereHas('role', fn ($query) => $query->where('name', 'Chef de filiere'))
                ->pluck('id'))
            ->merge(User::where('is_active', true)->whereHas('role', fn ($query) => $query->where('name', 'Super Admin'))->pluck('id'))
            ->unique();

        $recipientIds = User::whereIn('id', $recipientIds)->where('is_active', true)->pluck('id');

        $recipientIds->each(fn (int $userId) => Notification::create([
            'user_id' => $userId,
            'title' => 'Demande de modification PFE',
            'type' => 'workflow',
            'content' => $request->user()->first_name.' '.$request->user()->last_name.' demande la réouverture de sa fiche PFE.',
            'action_url' => '/modification-requests',
        ]));

        AuditService::record($request, 'pfe.modification_requested', $modificationRequest, [
            'pfe_id' => $pfe->id,
        ]);

        return response()->json($modificationRequest->load(['requester:id,first_name,last_name', 'pfe:id,title']), 201);
    }

    public function supervisorDecision(Request $request, PfeModificationRequest $modificationRequest): JsonResponse
    {
        $modificationRequest->loadMissing('pfe');
        abort_unless($modificationRequest->pfe->academic_supervisor_id === $request->user()->id, 403);

        return $this->decide($request, $modificationRequest);
    }

    public function chefDecision(Request $request, PfeModificationRequest $modificationRequest): JsonResponse
    {
        $modificationRequest->loadMissing('pfe');
        abort_unless($modificationRequest->pfe->filiere_id === $request->user()->filiere_id, 403);

        return $this->decide($request, $modificationRequest);
    }

    public function adminDecision(Request $request, PfeModificationRequest $modificationRequest): JsonResponse
    {
        return $this->decide($request, $modificationRequest);
    }

    private function decide(Request $request, PfeModificationRequest $modificationRequest): JsonResponse
    {
        $data = $request->validate([
            'decision' => ['required', Rule::in(['Approuvée', 'Rejetée'])],
            'decision_note' => ['nullable', 'required_if:decision,Rejetée', 'string', 'max:5000'],
        ]);

        $updatedRequest = DB::transaction(function () use ($request, $modificationRequest, $data) {
            $lockedRequest = PfeModificationRequest::query()->lockForUpdate()->findOrFail($modificationRequest->id);
            if ($lockedRequest->status !== 'En attente') {
                abort(409, 'Cette demande a déjà été traitée.');
            }

            $pfe = Pfe::query()->lockForUpdate()->findOrFail($lockedRequest->pfe_id);
            if ($data['decision'] === 'Approuvée') {
                if ($pfe->status !== 'Validé') {
                    abort(409, 'Le PFE n’est plus dans un état validé et ne peut pas être rouvert.');
                }
                $pfe->update([
                    'status' => 'Modifications demandées',
                    'refusal_reason' => null,
                    'submitted_at' => null,
                    'subject_validated_at' => null,
                    'final_validated_at' => null,
                ]);
            }

            $lockedRequest->update([
                'status' => $data['decision'],
                'decided_by' => $request->user()->id,
                'decision_note' => $data['decision_note'] ?? null,
                'decided_at' => now(),
            ]);

            return $lockedRequest;
        });

        $updatedRequest->loadMissing('pfe');
        Notification::create([
            'user_id' => $updatedRequest->pfe->student_id,
            'title' => $data['decision'] === 'Approuvée' ? 'Modification du PFE autorisée' : 'Demande de modification refusée',
            'type' => 'workflow',
            'content' => $data['decision'] === 'Approuvée'
                ? 'Votre fiche PFE est de nouveau modifiable. Enregistrez vos changements puis soumettez-la à nouveau.'
                : ($data['decision_note'] ?? 'Votre demande a été refusée.'),
            'action_url' => '/student/pfe',
        ]);

        AuditService::record($request, 'pfe.modification_decided', $updatedRequest, [
            'decision' => $data['decision'],
            'decision_note' => $data['decision_note'] ?? null,
            'pfe_id' => $updatedRequest->pfe_id,
        ]);

        return response()->json($updatedRequest->load([
            'requester:id,first_name,last_name',
            'decider:id,first_name,last_name',
            'pfe.student:id,first_name,last_name',
        ]));
    }
}
