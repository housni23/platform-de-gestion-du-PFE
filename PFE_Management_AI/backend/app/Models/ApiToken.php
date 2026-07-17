<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiToken extends Model
{
    protected $fillable = [
        'user_id', 'name', 'access_token_hash', 'refresh_token_hash',
        'expires_at', 'refresh_expires_at', 'last_used_at', 'revoked_at',
        'ip_address', 'user_agent',
    ];

    protected $hidden = ['access_token_hash', 'refresh_token_hash'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'refresh_expires_at' => 'datetime',
            'last_used_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
