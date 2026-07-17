<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompteRendu extends Model
{
    protected $table = 'comptes_rendus';

    protected $fillable = [
        'pfe_id',
        'percentage',
        'description',
    ];

    public function pfe(): BelongsTo
    {
        return $this->belongsTo(Pfe::class);
    }
}
