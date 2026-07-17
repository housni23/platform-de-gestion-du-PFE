<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comptes_rendus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pfe_id')->constrained('pfes')->onDelete('cascade');
            $table->integer('percentage');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comptes_rendus');
    }
};
