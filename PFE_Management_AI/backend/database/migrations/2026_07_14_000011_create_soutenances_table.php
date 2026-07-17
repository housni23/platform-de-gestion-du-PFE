<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('soutenances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pfe_id')->constrained('pfes')->onDelete('cascade');
            $table->dateTime('date');
            $table->string('room');
            $table->string('final_report')->nullable();
            $table->string('presentation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('soutenances');
    }
};
