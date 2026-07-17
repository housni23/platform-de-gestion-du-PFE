<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JuryMember extends Model
{
    protected $fillable = [
        'soutenance_id',
        'user_id',
        'role',
    ];

    public function soutenance(): BelongsTo
    {
        return $this->belongsTo(Soutenance::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
