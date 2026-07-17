<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('id');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('google_id')->nullable()->after('email');
            $table->string('password')->nullable()->change();
            $table->foreignId('role_id')->nullable()->after('password')->constrained('roles')->onDelete('set null');
            
            // Drop old name column
            if (Schema::hasColumn('users', 'name')) {
                $table->dropColumn('name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable();
            $table->dropForeign(['role_id']);
            $table->dropColumn(['first_name', 'last_name', 'google_id', 'role_id']);
            $table->string('password')->nullable(false)->change();
        });
    }
};
