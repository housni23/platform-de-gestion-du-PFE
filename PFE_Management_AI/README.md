# GestPFE — ENSA Marrakech

Plateforme web de gestion des projets de fin d'études conforme au cahier des charges ENSA Marrakech (version 1.0, juillet 2026).

## Architecture

- `backend/` : API REST Laravel 12 / PHP 8.2+
- `frontend/` : React 19, TypeScript, Vite et interface responsive
- `DOCS/` : diagrammes et wireframes initiaux

## Fonctionnalités V1 livrées

- Google OpenID Connect avec restriction des domaines institutionnels
- Connexion locale sécurisée, disponible uniquement en développement et en test
- Jetons d'accès courts, jetons de renouvellement rotatifs, expiration et révocation
- RBAC strict pour Étudiant, Encadrant, Chef de filière et Super Admin
- Journal d'audit des connexions et actions sensibles
- Fiche PFE, circuit de soumission et double validation
- Verrouillage des fiches validées avec demande motivée de réouverture
- Approbation ou refus des demandes par l’encadrant, le chef de filière ou le Super Admin
- Jalons, progression et comptes rendus horodatés
- Messagerie par PFE et demandes de rendez-vous
- Dépôt privé de vrais fichiers avec taille, format, version et statut de validation
- Notifications in-app
- Affectation des encadrants avec contrôle de capacité
- Planification des soutenances, composition du jury et détection des conflits
- Évaluations réservées aux membres du jury
- Administration des comptes, rôles, filières et années universitaires
- Export CSV UTF-8 compatible Excel
- Interface responsive pour ordinateur, tablette et mobile
- Assistant IA sécurisé et adapté aux quatre rôles
- Conseil, synthèse, rédaction, relecture et analyse de documents PFE
- Historique privé des conversations IA avec contrôle d’accès et limitation du débit

## Installation du backend

Prérequis : PHP 8.2+, Composer, MySQL 8+ (ou SQLite pour une démonstration).

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configurez la base de données dans `.env`, puis exécutez :

```bash
php artisan migrate --seed
php artisan serve
```

L'API est disponible par défaut sur `http://127.0.0.1:8000/api`.

## Installation du frontend

Prérequis : Node.js 20.19+ (ou 22.12+) et npm.

```bash
cd frontend
npm install
npm run dev
```

L'interface est disponible sur `http://localhost:5173` et transmet `/api` vers Laravel en développement.

## Comptes de démonstration

La connexion locale doit rester activée uniquement dans l'environnement local. Le mot de passe commun des données de démonstration est `DemoPass!2026`.

| Rôle | E-mail |
| --- | --- |
| Étudiant | `ahmed.benali@edu.uca.ma` |
| Encadrant | `k.alaoui@uca.ma` |
| Chef de filière | `n.elmansouri@uca.ma` |
| Super Admin | `admin@uca.ma` |

## Configuration Google OAuth

Créez des identifiants OAuth 2.0 dans Google Cloud Console, ajoutez l'URI de redirection du frontend, puis renseignez :

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
GOOGLE_ALLOWED_DOMAINS=edu.uca.ma,uca.ma
```

En production :

```env
APP_ENV=production
APP_DEBUG=false
LOCAL_LOGIN_ENABLED=false
```

Changez également `APP_URL`, `FRONTEND_URL`, les paramètres MySQL, SMTP et les secrets OAuth.

## Configuration de GestPFE IA

L’assistant utilise l’API Gemini depuis Laravel. Consultez [`AI_SETUP.md`](AI_SETUP.md) pour créer une clé gratuite, ajouter `GEMINI_API_KEY`, choisir le modèle, lancer la migration et tester l’analyse de documents. La clé ne doit jamais être placée dans le frontend.

## Vérification

Backend :

```bash
cd backend
php artisan test
```

Frontend :

```bash
cd frontend
npm run build
```

Le build frontend exécute d'abord le contrôle TypeScript strict.

## Phases externes prévues

Les intégrations nécessitant des contrats ou décisions institutionnelles restent configurables : emails SMTP réels, génération PDF des conventions/PV et service anti-plagiat. L’assistant IA est livré mais reste désactivé tant qu’une clé API n’est pas configurée.
