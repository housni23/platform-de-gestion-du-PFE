<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnneeAcademique;
use App\Models\AuditLog;
use App\Models\Filiere;
use App\Models\Pfe;
use App\Models\PfeModificationRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function getDashboard(Request $request): JsonResponse
    {
        $users = User::with(['role', 'filiere'])->orderBy('last_name')->paginate(50);
        $roles = Role::withCount('users')->get();
        $departments = Filiere::withCount('pfes')->get();
        $years = AnneeAcademique::orderByDesc('start_date')->get();
        $logs = AuditLog::with('user:id,first_name,last_name')->latest()->limit(30)->get();
        $pfes = Pfe::with('milestones')->get();
        $modificationRequests = PfeModificationRequest::with([
            'pfe:id,title,student_id,filiere_id',
            'pfe.student:id,first_name,last_name',
            'pfe.filiere:id,name,code',
            'requester:id,first_name,last_name',
        ])->where('status', 'En attente')->latest()->get();

        $progressByDepartment = $departments->map(function (Filiere $filiere) use ($pfes) {
            $departmentPfes = $pfes->where('filiere_id', $filiere->id);
            return [
                'dept' => $filiere->name,
                'code' => $filiere->code,
                'total' => $departmentPfes->count(),
                'validated' => $departmentPfes->where('status', 'Validé')->count(),
                'progress' => $departmentPfes->count() ? (int) round($departmentPfes->avg(fn (Pfe $pfe) => $pfe->progressPercentage())) : 0,
            ];
        });

        return response()->json([
            'admin' => $this->basicUser($request->user()),
            'users' => $users,
            'roles_list' => $roles,
            'academic_years' => $years,
            'logs' => $logs,
            'departments' => $departments,
            'global_progress' => $progressByDepartment,
            'modification_requests' => $modificationRequests,
            'kpis' => [
                'total_users' => User::count(),
                'active_users' => User::where('is_active', true)->count(),
                'active_pfes' => Pfe::whereNotIn('status', ['Archivé', 'Refusé'])->count(),
                'depts_count' => $departments->count(),
                'completion_rate' => $pfes->count() ? (int) round(100 * $pfes->where('status', 'Validé')->count() / $pfes->count()) : 0,
                'pending_modification_requests' => $modificationRequests->count(),
            ],
        ]);
    }

    public function createUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role_name' => ['required', Rule::in(['Etudiant', 'Encadrant', 'Chef de filiere', 'Super Admin'])],
            'filiere_id' => ['nullable', 'required_if:role_name,Chef de filiere', 'exists:filieres,id'],
            'password' => ['nullable', 'string', 'min:12'],
        ]);
        $role = Role::where('name', $data['role_name'])->firstOrFail();
        $user = User::create([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => strtolower($data['email']),
            'password' => !empty($data['password']) ? Hash::make($data['password']) : null,
            'role_id' => $role->id,
            'filiere_id' => $data['filiere_id'] ?? null,
            'is_active' => true,
        ]);
        AuditService::record($request, 'user.created', $user, ['role' => $role->name]);

        return response()->json($user->load(['role', 'filiere']), 201);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'role_name' => ['required', Rule::in(['Etudiant', 'Encadrant', 'Chef de filiere', 'Super Admin'])],
            'filiere_id' => ['nullable', 'required_if:role_name,Chef de filiere', 'exists:filieres,id'],
        ]);
        if ($user->id === $request->user()->id && $data['role_name'] !== 'Super Admin') {
            return response()->json(['message' => 'Vous ne pouvez pas retirer votre propre rôle administrateur.'], 409);
        }
        $role = Role::where('name', $data['role_name'])->firstOrFail();
        $previousRole = $user->role?->name;
        $user->update(['role_id' => $role->id, 'filiere_id' => $data['filiere_id'] ?? null]);
        $user->apiTokens()->update(['revoked_at' => now()]);
        AuditService::record($request, 'user.role_changed', $user, ['from' => $previousRole, 'to' => $role->name]);

        return response()->json($user->load(['role', 'filiere']));
    }

    public function toggleUserStatus(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas désactiver votre propre compte.'], 409);
        }
        $user->update(['is_active' => !$user->is_active]);
        if (!$user->is_active) {
            $user->apiTokens()->whereNull('revoked_at')->update(['revoked_at' => now()]);
        }
        AuditService::record($request, 'user.status_changed', $user, ['is_active' => $user->is_active]);

        return response()->json(['success' => true, 'user' => $user->load(['role', 'filiere'])]);
    }

    public function deleteUser(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 409);
        }
        if ($user->pfe()->exists() || $user->supervisedPfes()->exists() || $user->juryMembers()->exists()) {
            return response()->json(['message' => 'Ce compte possède un historique académique. Désactivez-le au lieu de le supprimer.'], 409);
        }
        AuditService::record($request, 'user.deleted', $user, ['email' => $user->email]);
        $user->delete();

        return response()->json(status: 204);
    }

    public function saveFiliere(Request $request, ?Filiere $filiere = null): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:20', Rule::unique('filieres', 'code')->ignore($filiere?->id)],
        ]);
        $filiere ??= new Filiere();
        $filiere->fill($data)->save();
        AuditService::record($request, $filiere->wasRecentlyCreated ? 'filiere.created' : 'filiere.updated', $filiere);

        return response()->json($filiere, $filiere->wasRecentlyCreated ? 201 : 200);
    }

    public function saveAcademicYear(Request $request, ?AnneeAcademique $academicYear = null): JsonResponse
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:50', Rule::unique('annees_academiques', 'label')->ignore($academicYear?->id)],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);
        $academicYear ??= new AnneeAcademique();
        $academicYear->fill($data)->save();
        AuditService::record($request, $academicYear->wasRecentlyCreated ? 'academic_year.created' : 'academic_year.updated', $academicYear);

        return response()->json($academicYear, $academicYear->wasRecentlyCreated ? 201 : 200);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $logs = AuditLog::with('user:id,first_name,last_name,email')
            ->when($request->filled('action'), fn ($query) => $query->where('action', 'like', '%'.$request->string('action').'%'))
            ->latest()->paginate(min((int) $request->input('per_page', 50), 100));

        return response()->json($logs);
    }

    private function basicUser($user): array
    {
        return ['id' => $user->id, 'first_name' => $user->first_name, 'last_name' => $user->last_name, 'email' => $user->email];
    }
}
