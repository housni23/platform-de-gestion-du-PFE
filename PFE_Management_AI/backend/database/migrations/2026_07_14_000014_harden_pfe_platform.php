<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('filiere_id')->nullable()->after('role_id')->constrained('filieres')->nullOnDelete();
            $table->boolean('is_active')->default(true)->after('filiere_id');
            $table->string('locale', 5)->default('fr')->after('is_active');
            $table->timestamp('last_login_at')->nullable()->after('locale');
        });

        Schema::create('api_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->default('web');
            $table->string('access_token_hash', 64)->unique();
            $table->string('refresh_token_hash', 64)->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamp('refresh_expires_at')->index();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('revoked_at')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action')->index();
            $table->nullableMorphs('subject');
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });

        Schema::table('entreprises', function (Blueprint $table) {
            $table->string('sector')->nullable()->after('name');
            $table->string('contact_phone')->nullable()->after('city');
        });

        Schema::table('pfes', function (Blueprint $table) {
            $table->text('refusal_reason')->nullable()->after('status');
            $table->timestamp('submitted_at')->nullable()->after('end_date');
            $table->timestamp('subject_validated_at')->nullable()->after('submitted_at');
            $table->timestamp('final_validated_at')->nullable()->after('subject_validated_at');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->string('original_name')->nullable()->after('name');
            $table->string('mime_type')->nullable()->after('file_path');
            $table->unsignedBigInteger('size')->nullable()->after('mime_type');
            $table->string('status')->default('En attente')->after('version');
            $table->text('comments')->nullable()->after('status');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('read_at')->nullable()->after('message');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->string('type')->default('info')->after('title');
            $table->string('action_url')->nullable()->after('content');
        });

        Schema::create('pfe_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pfe_id')->constrained('pfes')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->date('due_date')->nullable();
            $table->string('status')->default('À faire');
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
            $table->unique(['pfe_id', 'name']);
        });

        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pfe_id')->constrained('pfes')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('scheduled_at');
            $table->string('location')->nullable();
            $table->text('agenda')->nullable();
            $table->string('status')->default('En attente');
            $table->text('response')->nullable();
            $table->timestamps();
        });

        Schema::table('soutenances', function (Blueprint $table) {
            $table->string('status')->default('Planifiée')->after('room');
            $table->unsignedSmallInteger('duration_minutes')->default(45)->after('status');
            $table->unique('pfe_id');
        });

        Schema::table('jury_members', function (Blueprint $table) {
            $table->unique(['soutenance_id', 'user_id']);
        });

        Schema::table('evaluations', function (Blueprint $table) {
            $table->unique(['soutenance_id', 'evaluator_id']);
        });
    }

    public function down(): void
    {
        Schema::table('evaluations', fn (Blueprint $table) => $table->dropUnique(['soutenance_id', 'evaluator_id']));
        Schema::table('jury_members', fn (Blueprint $table) => $table->dropUnique(['soutenance_id', 'user_id']));
        Schema::table('soutenances', function (Blueprint $table) {
            $table->dropUnique(['pfe_id']);
            $table->dropColumn(['status', 'duration_minutes']);
        });
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('pfe_milestones');
        Schema::table('notifications', fn (Blueprint $table) => $table->dropColumn(['type', 'action_url']));
        Schema::table('messages', fn (Blueprint $table) => $table->dropColumn('read_at'));
        Schema::table('documents', fn (Blueprint $table) => $table->dropColumn(['original_name', 'mime_type', 'size', 'status', 'comments']));
        Schema::table('pfes', fn (Blueprint $table) => $table->dropColumn(['refusal_reason', 'submitted_at', 'subject_validated_at', 'final_validated_at']));
        Schema::table('entreprises', fn (Blueprint $table) => $table->dropColumn(['sector', 'contact_phone']));
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('api_tokens');
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['filiere_id']);
            $table->dropColumn(['filiere_id', 'is_active', 'locale', 'last_login_at']);
        });
    }
};
