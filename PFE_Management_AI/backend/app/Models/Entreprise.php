<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entreprise extends Model
{
    protected $fillable = [
        'name',
        'sector',
        'address',
        'city',
        'contact_phone',
        'supervisor_name',
        'supervisor_email',
    ];

    public function pfes(): HasMany
    {
        return $this->hasMany(Pfe::class);
    }
}
