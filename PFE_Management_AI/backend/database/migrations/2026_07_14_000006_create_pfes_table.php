<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pfes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status'); // e.g. brouillon, soumis, valide, refuse
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('academic_supervisor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('entreprise_id')->nullable()->constrained('entreprises')->onDelete('set null');
            $table->foreignId('filiere_id')->nullable()->constrained('filieres')->onDelete('set null');
            $table->foreignId('academic_year_id')->nullable()->constrained('annees_academiques')->onDelete('set null');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pfes');
    }
};
