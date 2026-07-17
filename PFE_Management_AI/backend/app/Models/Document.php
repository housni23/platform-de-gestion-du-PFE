<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    protected $fillable = [
        'pfe_id',
        'uploaded_by',
        'name',
        'original_name',
        'file_path',
        'mime_type',
        'size',
        'type',
        'version',
        'status',
        'comments',
    ];

    protected function casts(): array
    {
        return ['size' => 'integer', 'version' => 'integer'];
    }

    public function pfe(): BelongsTo
    {
        return $this->belongsTo(Pfe::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
