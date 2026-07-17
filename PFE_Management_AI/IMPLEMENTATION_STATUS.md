# Correspondance avec le cahier des charges

| Exigence | État | Notes |
| --- | --- | --- |
| Google OAuth institutionnel | Implémenté, à configurer | OpenID Connect, domaine contrôlé, rôle Étudiant par défaut |
| JWT/refresh ou jetons équivalents | Implémenté | Jetons opaques hachés, accès court, refresh rotatif, révocation |
| RBAC | Implémenté | Middleware serveur et contrôle d'appartenance métier |
| Journal d'audit | Implémenté | Connexions, validations, rôles, exports, documents et soutenances |
| Espace Étudiant | Implémenté V1 | Fiche, verrouillage après validation, demande de réouverture, jalons, rapports, messages, rendez-vous, documents, notifications, soutenance |
| Espace Encadrant | Implémenté V1 | Portefeuille, validations, traitement des demandes de réouverture, documents, messages, alertes, rendez-vous, évaluation |
| Espace Chef de filière | Implémenté V1 | Vue filtrable, validation finale, traitement des demandes de réouverture, affectation, planning, jury, export |
| Espace Super Admin | Implémenté V1 | Comptes, activation, filières, années, demandes de réouverture, supervision et audit |
| Fichiers privés et versionnés | Implémenté | Formats/tailles contrôlés et téléchargement autorisé par relation |
| Planification sans conflit | Implémenté | Contrôle du chevauchement des salles et membres du jury |
| Notifications in-app | Implémenté | Créées aux événements de workflow |
| Emails/SMS | Préparé, non activé | Nécessite la configuration SMTP et une politique d'envoi |
| Convention générée et signée | Phase suivante | Le dépôt et la validation sont présents; le modèle PDF reste à valider |
| Bibliothèque de sujets | Phase suivante | Non prioritaire dans le développement V1 décrit au planning |
| PDF/PV/attestations | Phase suivante | Dépend des modèles institutionnels officiels |
| Anti-plagiat | Intégration externe | Nécessite Compilatio/Turnitin et un contrat API |
| Interface arabe | Phase suivante | Structure `locale` prête; traduction complète à faire valider |
| Assistant IA contextuel | Implémenté, à configurer | API Gemini, contexte filtré par rôle, documents autorisés, historique privé et clé backend |
| RAG institutionnel à grande échelle | Phase suivante | Nécessite une base documentaire validée, une politique de conservation et la validation CNDP/loi 09-08 |

## Garanties ajoutées pendant la correction

- Aucun `X-User-Id` ni utilisateur par défaut ne peut contourner l'authentification.
- Le mot de passe est effectivement vérifié en mode local.
- Un rôle ne peut pas appeler les routes d'un autre rôle.
- Un encadrant ne peut agir que sur ses PFE.
- Un chef de filière ne peut agir que dans sa filière.
- Une fiche validée ne peut être rouverte qu’après une demande persistée, motivée et approuvée.
- Une demande de réouverture ne peut être traitée qu’une seule fois et toutes les décisions sont auditées.
- L'identité de l'évaluateur provient de la session, jamais du formulaire.
- Les comptes désactivés perdent immédiatement leurs sessions.
- Les fichiers ne sont pas placés dans un répertoire public.
- La clé Gemini reste dans Laravel et les documents ne sont transmis que sur sélection explicite d’un utilisateur autorisé.
