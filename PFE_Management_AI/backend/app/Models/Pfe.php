<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pfe extends Model
{
    protected $table = 'pfes';

    protected $fillable = [
        'title',
        'description',
        'status',
        'refusal_reason',
        'start_date',
        'end_date',
        'student_id',
        'academic_supervisor_id',
        'entreprise_id',
        'filiere_id',
        'academic_year_id',
        'submitted_at',
        'subject_validated_at',
        'final_validated_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'submitted_at' => 'datetime',
            'subject_validated_at' => 'datetime',
            'final_validated_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function academicSupervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'academic_supervisor_id');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise_id');
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class, 'filiere_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AnneeAcademique::class, 'academic_year_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function comptesRendus(): HasMany
    {
        return $this->hasMany(CompteRendu::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function soutenance(): HasOne
    {
        return $this->hasOne(Soutenance::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(PfeMilestone::class)->orderBy('position');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function modificationRequests(): HasMany
    {
        return $this->hasMany(PfeModificationRequest::class)->latest();
    }

    public function progressPercentage(): int
    {
        if ($this->relationLoaded('milestones') && $this->milestones->isNotEmpty()) {
            return (int) round($this->milestones->avg('progress'));
        }

        return (int) ($this->comptesRendus()->latest()->value('percentage') ?? 0);
    }
}
