# Documentation Technique — iPOS Zen

Ce document explique la structure programmatique et la logique interne du système basée sur des standards de qualité élevés (Elite Standards).

## 🏗 Architecture Technique

### 1. Couche de Données (Data Layer)
Le système fonctionne comme un moteur de données indépendant à l'intérieur du navigateur :
*   **Logique des Identifiants :** L'identifiant `UUID` est utilisé comme clé primaire pour tous les enregistrements afin d'éviter les conflits de données lors de la synchronisation entre plusieurs appareils.
*   **Opérations Atomiques (Transactions) :** Toutes les opérations sensibles (telles que `processSale` et `processReturn`) sont encapsulées dans `db.transaction` pour garantir l'intégrité des données et prévenir les erreurs dues à des opérations incomplètes.

### 2. Moteur de Synchronisation (Sync Engine)
Le système suit un protocole de synchronisation bidirectionnel :
1.  **Pull :** Récupération des dernières données depuis le cloud.
2.  **Merge :** Comparaison des horodatages `updatedAt`. L'enregistrement le plus récent est toujours conservé.
3.  **Push :** Envoi des nouvelles modifications locales.

### 3. Ingénierie de l'Interface (UI Engineering)
L'interface a été conçue spécifiquement pour offrir une productivité maximale :
*   **Densité des Données :** Utilisation des hauteurs `h-9` et `h-10` pour les éléments interactifs afin de fournir un espace vertical suffisant.
*   **Keyboard First :** Support complet des raccourcis clavier (F1-F10) pour accélérer le processus de vente dans les environnements encombrés.
*   **Stabilité du Rendu :** Tous les "hooks" (comme `useDebounce`) ont été sécurisés pour garantir que l'interface ne gèle pas lors du traitement local de milliers d'enregistrements.

## 🔐 Confidentialité et Sécurité
*   **Stockage Local 100% :** Aucune donnée commerciale n'est envoyée à des serveurs externes à moins que l'utilisateur n'ait configuré ses propres paramètres Supabase.
*   **Purge des Données :** Les données sont nettoyées des identifiants locaux temporaires avant d'être téléchargées sur le cloud pour éviter tout conflit dans les bases de données.
