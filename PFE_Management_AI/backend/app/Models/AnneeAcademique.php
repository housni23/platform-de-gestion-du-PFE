<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnneeAcademique extends Model
{
    protected $table = 'annees_academiques';

    protected $fillable = ['label', 'start_date', 'end_date'];

    protected function casts(): array
    {
        return ['start_date' => 'date', 'end_date' => 'date'];
    }

    public function pfes(): HasMany
    {
        return $this->hasMany(Pfe::class, 'academic_year_id');
    }
}
