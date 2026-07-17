<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PfeMilestone extends Model
{
    protected $fillable = ['pfe_id', 'name', 'progress', 'due_date', 'status', 'position'];

    protected function casts(): array
    {
        return ['due_date' => 'date', 'progress' => 'integer'];
    }

    public function pfe(): BelongsTo
    {
        return $this->belongsTo(Pfe::class);
    }
}
