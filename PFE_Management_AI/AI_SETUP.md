# Configuration de GestPFE IA avec Gemini

GestPFE IA utilise l’API **Gemini** depuis Laravel. La clé reste exclusivement dans le backend : ne l’ajoutez jamais dans `frontend/`, Git, une capture d’écran ou un message.

## 1. Créer une clé Gemini gratuite

1. Ouvrez <https://aistudio.google.com/apikey>.
2. Connectez-vous avec votre compte Google.
3. Créez ou sélectionnez un projet, puis cliquez sur **Create API key**.
4. Copiez la clé et conservez-la dans un gestionnaire de secrets.

Gemini propose un niveau gratuit avec des limites de requêtes. Les quotas et les modèles disponibles dépendent du compte, de la région et des règles Google en vigueur. Pour des données académiques confidentielles, vérifiez les conditions institutionnelles avant d’utiliser le niveau gratuit.

## 2. Configurer Laravel

Dans `backend/.env`, ajoutez :

```env
GEMINI_API_KEY=collez_votre_cle_ici
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TEMPERATURE=0.3
GEMINI_MAX_OUTPUT_TOKENS=1800
GEMINI_TIMEOUT_SECONDS=90
GEMINI_DOCUMENT_MAX_KB=10240
```

`gemini-3.5-flash` est le modèle stable par défaut. Vous pouvez modifier `GEMINI_MODEL` sans changer le code. Les anciennes variables `OPENAI_*` ne sont plus utilisées.

Rechargez ensuite la configuration :

```powershell
cd backend
php artisan config:clear
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Dans un second terminal :

```powershell
cd frontend
$env:VITE_API_URL="http://127.0.0.1:8000/api"
npm run dev
```

Ouvrez `http://localhost:5173`, connectez-vous et cliquez sur **GestPFE IA** en bas à droite.

## Fonctions disponibles

- Conseil conversationnel adapté au rôle connecté.
- Contexte filtré : l’étudiant voit son PFE, l’encadrant ses étudiants, le chef sa filière et l’administrateur les indicateurs globaux.
- Modes Conseil, Synthèse, Rédaction et Relecture.
- Analyse des PDF, documents Word, présentations et fichiers texte autorisés.
- Historique privé des conversations par utilisateur.
- Limitation du débit, journal d’audit et messages d’erreur sécurisés.

## Sécurité et limites

- L’assistant est en lecture seule : il ne valide pas un sujet, ne modifie pas une note et ne déclenche aucune opération métier.
- Les documents sont envoyés à Gemini uniquement lorsqu’un utilisateur autorisé les sélectionne explicitement.
- Un utilisateur ne peut sélectionner que les documents auxquels son rôle donne déjà accès.
- Les pièces jointes sont limitées à 10 Mo par défaut afin de rester sous la limite des requêtes inline.
- Les réponses générées doivent être vérifiées avant toute utilisation académique ou administrative.
- En production, configurez les règles institutionnelles de conservation, confidentialité et traitement des données avant d’activer l’analyse de documents.

## Erreurs fréquentes

- **Configuration requise** : vérifiez `GEMINI_API_KEY`, puis exécutez `php artisan config:clear`.
- **Clé invalide ou non autorisée** : recréez une clé dans Google AI Studio et vérifiez les restrictions du projet.
- **Quota atteint** : attendez la réinitialisation du quota gratuit ou activez la facturation Google.
- **Modèle introuvable** : utilisez un modèle disponible pour votre compte, par exemple `gemini-3.5-flash`.
- **Document refusé** : vérifiez son format, son type MIME et sa taille.

## Vérification

```powershell
cd backend
php artisan test

cd ..\frontend
npm run build
```

## Configuration Google OAuth

La clé Gemini ne remplace pas les identifiants Google OAuth de connexion. Pour la connexion institutionnelle, créez des identifiants OAuth 2.0 dans Google Cloud Console et renseignez séparément :

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
