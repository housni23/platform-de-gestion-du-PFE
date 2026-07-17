<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Filiere extends Model
{
    protected $fillable = ['name', 'code'];

    public function pfes(): HasMany
    {
        return $this->hasMany(Pfe::class);
    }
}
