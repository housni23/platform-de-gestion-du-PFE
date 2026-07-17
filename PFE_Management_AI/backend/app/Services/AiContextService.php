<?php

namespace App\Services;

use App\Models\Document;
use App\Models\Pfe;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AiContextService
{
    public function suggestions(User $user): array
    {
        return match ($user->roleKey()) {
            'student' => [
                'Analyse mon avancement et propose mes trois prochaines priorités.',
                'Aide-moi à rédiger mon prochain compte rendu PFE.',
                'Prépare un plan structuré pour mon rapport final.',
                'Quels risques peuvent retarder mon projet ?',
            ],
            'supervisor' => [
                'Résume la situation de mes étudiants encadrés.',
                'Identifie les PFE qui nécessitent une intervention prioritaire.',
                'Prépare une grille de retour constructif pour un rapport.',
                'Propose l’ordre du jour de ma prochaine réunion de suivi.',
            ],
            'chef' => [
                'Donne-moi une synthèse des PFE de ma filière.',
                'Identifie les projets en retard ou en attente de validation.',
                'Propose un plan de préparation des soutenances.',
                'Rédige une communication aux encadrants de la filière.',
            ],
            'admin' => [
                'Résume l’état global de la plateforme PFE.',
                'Explique la répartition des utilisateurs et des projets.',
                'Propose une checklist de contrôle avant les soutenances.',
                'Rédige une note administrative concernant la campagne PFE.',
            ],
            default => ['Comment peux-tu m’aider dans GestPFE ?'],
        };
    }

    public function availableDocuments(User $user): Collection
    {
        return $this->documentQuery($user)
            ->with('pfe:id,title')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Document $document) => [
                'id' => $document->id,
                'name' => $document->name,
                'original_name' => $document->original_name,
                'type' => $document->type,
                'version' => $document->version,
                'status' => $document->status,
                'mime_type' => $document->mime_type,
                'size' => $document->size,
                'pfe_title' => $document->pfe?->title,
                'ai_supported' => $this->isSupportedDocument($document),
            ]);
    }

    public function findAuthorizedDocument(User $user, int $documentId): ?Document
    {
        return $this->documentQuery($user)->whereKey($documentId)->first();
    }

    public function contextFor(User $user): string
    {
        $payload = [
            'generated_at' => now()->toIso8601String(),
            'current_user' => [
                'id' => $user->id,
                'name' => trim($user->first_name.' '.$user->last_name),
                'role' => $user->roleKey(),
                'role_label' => $user->role?->name,
                'filiere' => $user->filiere?->only(['id', 'name', 'code']),
            ],
            'workspace' => $this->roleContext($user),
        ];

        return json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
    }

    public function isSupportedDocument(Document $document): bool
    {
        $extension = strtolower(pathinfo($document->original_name ?: $document->file_path, PATHINFO_EXTENSION));

        return in_array($extension, ['pdf', 'doc', 'docx', 'rtf', 'odt', 'ppt', 'pptx', 'txt', 'md', 'csv', 'xls', 'xlsx'], true);
    }

    private function roleContext(User $user): array
    {
        return match ($user->roleKey()) {
            'student' => $this->studentContext($user),
            'supervisor' => $this->supervisorContext($user),
            'chef' => $this->chefContext($user),
            'admin' => $this->adminContext(),
            default => [],
        };
    }

    private function studentContext(User $user): array
    {
        $pfe = $user->pfe()->with([
            'filiere:id,name,code',
            'academicYear:id,label,start_date,end_date',
            'academicSupervisor:id,first_name,last_name,email',
            'entreprise',
            'milestones:id,pfe_id,name,progress,status,due_date,position',
            'comptesRendus' => fn ($query) => $query->latest()->limit(10),
            'documents' => fn ($query) => $query->latest()->limit(20),
            'appointments' => fn ($query) => $query->latest()->limit(10),
            'soutenance.juryMembers.user:id,first_name,last_name',
        ])->first();

        if (!$pfe) {
            return ['pfe' => null, 'message' => 'Aucune fiche PFE créée.'];
        }

        return ['pfe' => [
            'id' => $pfe->id,
            'title' => $pfe->title,
            'description' => $pfe->description,
            'status' => $pfe->status,
            'refusal_reason' => $pfe->refusal_reason,
            'period' => [$pfe->start_date?->toDateString(), $pfe->end_date?->toDateString()],
            'progress' => $pfe->progressPercentage(),
            'filiere' => $pfe->filiere?->only(['name', 'code']),
            'academic_year' => $pfe->academicYear?->label,
            'supervisor' => $pfe->academicSupervisor?->only(['first_name', 'last_name', 'email']),
            'company' => $pfe->entreprise?->only(['name', 'sector', 'city', 'supervisor_name']),
            'milestones' => $pfe->milestones->map->only(['name', 'progress', 'status', 'due_date'])->all(),
            'recent_reports' => $pfe->comptesRendus->map->only(['percentage', 'description', 'created_at'])->all(),
            'documents' => $pfe->documents->map->only(['id', 'name', 'type', 'version', 'status', 'comments'])->all(),
            'appointments' => $pfe->appointments->map->only(['scheduled_at', 'location', 'agenda', 'status', 'response'])->all(),
            'defense' => $pfe->soutenance?->only(['date', 'room', 'status', 'duration_minutes']),
        ]];
    }

    private function supervisorContext(User $user): array
    {
        $pfes = $user->supervisedPfes()->with([
            'student:id,first_name,last_name,email',
            'filiere:id,name,code',
            'milestones:id,pfe_id,name,progress,status,due_date',
            'documents' => fn ($query) => $query->latest()->limit(5),
            'comptesRendus' => fn ($query) => $query->latest()->limit(3),
        ])->latest()->limit(40)->get();

        return [
            'totals' => [
                'supervised_pfes' => $pfes->count(),
                'awaiting_review' => $pfes->whereIn('status', ['Soumis', 'Validé chef'])->count(),
            ],
            'pfes' => $this->summarizePfes($pfes),
        ];
    }

    private function chefContext(User $user): array
    {
        $pfes = Pfe::query()->where('filiere_id', $user->filiere_id)->with([
            'student:id,first_name,last_name,email',
            'academicSupervisor:id,first_name,last_name,email',
            'filiere:id,name,code',
            'milestones:id,pfe_id,name,progress,status,due_date',
            'documents' => fn ($query) => $query->latest()->limit(3),
        ])->latest()->limit(100)->get();

        return [
            'filiere' => $user->filiere?->only(['name', 'code']),
            'totals' => [
                'pfes' => $pfes->count(),
                'without_supervisor' => $pfes->whereNull('academic_supervisor_id')->count(),
                'validated' => $pfes->where('status', 'Validé')->count(),
            ],
            'status_distribution' => $pfes->countBy('status')->all(),
            'pfes' => $this->summarizePfes($pfes),
        ];
    }

    private function adminContext(): array
    {
        return [
            'totals' => [
                'users' => User::count(),
                'active_users' => User::where('is_active', true)->count(),
                'pfes' => Pfe::count(),
                'documents' => Document::count(),
            ],
            'users_by_role' => User::query()
                ->join('roles', 'roles.id', '=', 'users.role_id')
                ->selectRaw('roles.name as role_name, COUNT(*) as total')
                ->groupBy('roles.name')->pluck('total', 'role_name')->all(),
            'pfes_by_status' => Pfe::query()->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')->pluck('total', 'status')->all(),
            'recent_pfes' => $this->summarizePfes(Pfe::with([
                'student:id,first_name,last_name,email',
                'academicSupervisor:id,first_name,last_name,email',
                'filiere:id,name,code',
                'milestones:id,pfe_id,name,progress,status,due_date',
            ])->latest()->limit(30)->get()),
        ];
    }

    private function summarizePfes(Collection $pfes): array
    {
        return $pfes->map(fn (Pfe $pfe) => [
            'id' => $pfe->id,
            'title' => $pfe->title,
            'status' => $pfe->status,
            'progress' => $pfe->progressPercentage(),
            'end_date' => $pfe->end_date?->toDateString(),
            'student' => $pfe->student ? trim($pfe->student->first_name.' '.$pfe->student->last_name) : null,
            'supervisor' => $pfe->academicSupervisor ? trim($pfe->academicSupervisor->first_name.' '.$pfe->academicSupervisor->last_name) : null,
            'filiere' => $pfe->filiere?->code,
            'milestones' => $pfe->milestones->map->only(['name', 'progress', 'status', 'due_date'])->all(),
            'documents' => $pfe->relationLoaded('documents')
                ? $pfe->documents->map->only(['id', 'name', 'type', 'version', 'status', 'comments'])->all()
                : [],
            'recent_reports' => $pfe->relationLoaded('comptesRendus')
                ? $pfe->comptesRendus->map->only(['percentage', 'description', 'created_at'])->all()
                : [],
        ])->all();
    }

    private function documentQuery(User $user): Builder
    {
        return Document::query()->whereHas('pfe', function (Builder $query) use ($user) {
            match ($user->roleKey()) {
                'student' => $query->where('student_id', $user->id),
                'supervisor' => $query->where('academic_supervisor_id', $user->id),
                'chef' => $query->where('filiere_id', $user->filiere_id),
                'admin' => $query,
                default => $query->whereRaw('1 = 0'),
            };
        });
    }
}
