<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Soutenance extends Model
{
    protected $fillable = [
        'pfe_id',
        'date',
        'room',
        'status',
        'duration_minutes',
        'final_report',
        'presentation',
    ];

    protected $casts = [
        'date' => 'datetime',
    ];

    public function pfe(): BelongsTo
    {
        return $this->belongsTo(Pfe::class);
    }

    public function juryMembers(): HasMany
    {
        return $this->hasMany(JuryMember::class);
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class);
    }
}
