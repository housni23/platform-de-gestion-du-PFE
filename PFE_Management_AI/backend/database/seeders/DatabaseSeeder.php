<?php

namespace Database\Seeders;

use App\Models\AnneeAcademique;
use App\Models\CompteRendu;
use App\Models\Entreprise;
use App\Models\Filiere;
use App\Models\JuryMember;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Pfe;
use App\Models\PfeMilestone;
use App\Models\Role;
use App\Models\Soutenance;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $roles = collect(['Etudiant', 'Encadrant', 'Chef de filiere', 'Super Admin'])
            ->mapWithKeys(fn (string $name) => [$name => Role::firstOrCreate(['name' => $name])]);

        $filieres = collect([
            ['name' => 'Intelligence Artificielle et Data Science', 'code' => 'IADS'],
            ['name' => 'Génie Informatique', 'code' => 'GI'],
            ['name' => 'Réseaux et Télécommunications', 'code' => 'GRT'],
            ['name' => 'Génie Industriel et Logistique', 'code' => 'GIL'],
        ])->mapWithKeys(function (array $data) {
            $filiere = Filiere::firstOrCreate(['code' => $data['code']], $data);
            return [$data['code'] => $filiere];
        });

        $year = AnneeAcademique::firstOrCreate(
            ['label' => '2026–2027'],
            ['start_date' => '2026-09-01', 'end_date' => '2027-07-15']
        );

        $companies = collect([
            ['name' => 'OCP Group', 'sector' => 'Industrie et data', 'address' => 'Avenue Mohammed VI', 'city' => 'Marrakech', 'contact_phone' => '+212 5 24 00 00 00', 'supervisor_name' => 'M. Youssef Amrani', 'supervisor_email' => 'y.amrani@example.ma'],
            ['name' => 'UCA Digital Lab', 'sector' => 'Éducation numérique', 'address' => 'Campus universitaire', 'city' => 'Marrakech', 'contact_phone' => '+212 5 24 43 47 45', 'supervisor_name' => 'Mme Salma Idrissi', 'supervisor_email' => 's.idrissi@example.ma'],
            ['name' => 'Atlas Smart Systems', 'sector' => 'IoT', 'address' => 'Sidi Ghanem', 'city' => 'Marrakech', 'contact_phone' => '+212 5 24 33 00 00', 'supervisor_name' => 'M. Hamza Alaoui', 'supervisor_email' => 'h.alaoui@example.ma'],
        ])->mapWithKeys(function (array $data) {
            $company = Entreprise::firstOrCreate(['name' => $data['name']], $data);
            return [$data['name'] => $company];
        });

        $admin = $this->user('Admin', 'ENSA', 'admin@uca.ma', $roles['Super Admin']);
        $chefIads = $this->user('Nadia', 'El Mansouri', 'n.elmansouri@uca.ma', $roles['Chef de filiere'], $filieres['IADS']);
        $chefGi = $this->user('Mohamed', 'Bennani', 'm.bennani@uca.ma', $roles['Chef de filiere'], $filieres['GI']);
        $supervisorA = $this->user('Karim', 'Alaoui', 'k.alaoui@uca.ma', $roles['Encadrant'], $filieres['IADS']);
        $supervisorB = $this->user('Salma', 'Idrissi', 's.idrissi@uca.ma', $roles['Encadrant'], $filieres['GI']);
        $supervisorC = $this->user('Rachid', 'Tazi', 'r.tazi@uca.ma', $roles['Encadrant'], null);

        $projects = [
            ['first' => 'Ahmed', 'last' => 'Benali', 'email' => 'ahmed.benali@edu.uca.ma', 'title' => 'Système intelligent de prévision des stocks', 'status' => 'Validé', 'filiere' => 'IADS', 'supervisor' => $supervisorA, 'company' => 'OCP Group', 'progress' => [100, 85, 55, 20, 0]],
            ['first' => 'Sara', 'last' => 'Kaci', 'email' => 'sara.kaci@edu.uca.ma', 'title' => 'Application mobile de suivi e-santé', 'status' => 'Validé encadrant', 'filiere' => 'IADS', 'supervisor' => $supervisorA, 'company' => 'UCA Digital Lab', 'progress' => [100, 90, 65, 25, 0]],
            ['first' => 'Yassine', 'last' => 'Hamdi', 'email' => 'yassine.hamdi@edu.uca.ma', 'title' => 'Plateforme e-learning adaptative', 'status' => 'Soumis', 'filiere' => 'GI', 'supervisor' => $supervisorB, 'company' => 'UCA Digital Lab', 'progress' => [80, 35, 10, 0, 0]],
            ['first' => 'Meryem', 'last' => 'Ait Lahcen', 'email' => 'meryem.aitlahcen@edu.uca.ma', 'title' => 'Assistant RH fondé sur une architecture RAG', 'status' => 'Brouillon', 'filiere' => 'IADS', 'supervisor' => $supervisorC, 'company' => 'Atlas Smart Systems', 'progress' => [45, 10, 0, 0, 0]],
        ];

        foreach ($projects as $project) {
            $student = $this->user($project['first'], $project['last'], $project['email'], $roles['Etudiant'], $filieres[$project['filiere']]);
            $pfe = Pfe::firstOrCreate(
                ['student_id' => $student->id],
                [
                    'title' => $project['title'],
                    'description' => 'Projet de fin d’études réalisé dans le cadre de la formation d’ingénieur à l’ENSA Marrakech.',
                    'status' => $project['status'],
                    'start_date' => '2027-02-01',
                    'end_date' => '2027-06-30',
                    'submitted_at' => $project['status'] !== 'Brouillon' ? now() : null,
                    'subject_validated_at' => in_array($project['status'], ['Validé encadrant', 'Validé'], true) ? now() : null,
                    'final_validated_at' => $project['status'] === 'Validé' ? now() : null,
                    'academic_supervisor_id' => $project['supervisor']->id,
                    'entreprise_id' => $companies[$project['company']]->id,
                    'filiere_id' => $filieres[$project['filiere']]->id,
                    'academic_year_id' => $year->id,
                ]
            );

            foreach (['Cahier des charges', 'Conception', 'Réalisation', 'Rédaction', 'Soutenance'] as $position => $name) {
                $progress = $project['progress'][$position];
                PfeMilestone::firstOrCreate(
                    ['pfe_id' => $pfe->id, 'name' => $name],
                    [
                        'progress' => $progress,
                        'status' => $progress >= 100 ? 'Terminé' : ($progress > 0 ? 'En cours' : 'À faire'),
                        'position' => $position + 1,
                    ]
                );
            }

            if ($project['first'] === 'Ahmed') {
                CompteRendu::firstOrCreate(['pfe_id' => $pfe->id, 'description' => 'Cahier des charges finalisé.'], ['percentage' => 100]);
                CompteRendu::firstOrCreate(['pfe_id' => $pfe->id, 'description' => 'Conception validée et réalisation en cours.'], ['percentage' => 55]);
                Message::firstOrCreate([
                    'pfe_id' => $pfe->id,
                    'sender_id' => $supervisorA->id,
                    'receiver_id' => $student->id,
                    'message' => 'Bonjour Ahmed, la conception est claire. Merci de documenter les choix du modèle avant notre prochain suivi.',
                ]);
                Notification::firstOrCreate([
                    'user_id' => $student->id,
                    'title' => 'Compte rendu attendu',
                    'content' => 'Pensez à déposer votre prochain compte rendu mensuel.',
                ], ['type' => 'reminder', 'action_url' => '/student/progress']);

                $defense = Soutenance::firstOrCreate(
                    ['pfe_id' => $pfe->id],
                    ['date' => '2027-06-22 10:00:00', 'room' => 'Salle A12 - ENSA Marrakech', 'duration_minutes' => 45, 'status' => 'Planifiée']
                );
                foreach ([[$chefIads, 'Président'], [$supervisorA, 'Encadrant'], [$supervisorC, 'Examinateur']] as [$member, $role]) {
                    JuryMember::firstOrCreate(['soutenance_id' => $defense->id, 'user_id' => $member->id], ['role' => $role]);
                }
            }
        }
    }

    private function user(string $firstName, string $lastName, string $email, Role $role, ?Filiere $filiere = null): User
    {
        return User::updateOrCreate(
            ['email' => $email],
            [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'password' => Hash::make('DemoPass!2026'),
                'email_verified_at' => now(),
                'role_id' => $role->id,
                'filiere_id' => $filiere?->id,
                'is_active' => true,
                'locale' => 'fr',
            ]
        );
    }
}
