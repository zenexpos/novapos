# Documentation Technique - iPOS Smart

Ce document explique la structure logicielle et la logique interne du système basée sur l'examen du code source.

## 🏗 Architecture Technique

### 1. Couche de Données (Data Layer)
Le système fonctionne comme un moteur de données indépendant dans le navigateur :
*   **Schema Logic :** L'identifiant `UUID` est utilisé comme clé primaire pour tous les enregistrements afin de garantir l'unicité des données lors de la synchronisation entre plusieurs appareils.
*   **Transactions :** Toutes les opérations sensibles (comme `processSale` et `processReturn`) sont encapsulées dans `db.transaction` pour garantir l'intégrité des données et prévenir les erreurs dues à des opérations incomplètes.

### 2. Services Métiers (Business Services)
*   **Sales Service :** Responsable de la génération de numéros de facture uniques (YYMMDD-Random), du traitement des remises et du calcul des taxes.
*   **Inventory Service :** Le système ne supprime pas les données, mais s'appuie sur des "ajustements relatifs". Chaque modification de stock est enregistrée dans la table `inventory_logs` pour lier le mouvement à sa source (vente, retour ou réception de marchandise).
*   **Bread Service :** Gère la logique de planification hebdomadaire. Le serveur local génère des commandes pour chaque jour en fonction de la matrice des jours (`lundi`, `mardi`, ...).
*   **Zakat Service :** Moteur de calcul sophistiqué qui évalue les actifs (Valeur du stock + Créances - Dettes fournisseurs) et les compare au seuil du Nissab configuré dans le profil.

### 3. Moteur de Synchronisation (The Sync Engine)
Le système suit un protocole de synchronisation bidirectionnel :
1.  **Pull :** Récupération des données les plus récentes depuis le Cloud.
2.  **Merge :** Comparaison de l'horodatage `updatedAt`. L'enregistrement le plus récent est conservé.
3.  **Push :** Envoi des nouvelles modifications locales.

## 📏 Ingénierie de l'Interface (UI Engineering)
L'interface a été spécifiquement conçue pour une résolution de **1360x768** :
*   **Data Density :** Utilisation des hauteurs `h-9` et `h-10` pour les éléments interactifs.
*   **Zero-Scroll Policy :** L'en-tête et la barre d'information supérieure ont été réduits pour libérer de l'espace vertical permettant d'afficher au moins 15 articles dans le panier sans défilement.
*   **Keyboard First :** Support complet des raccourcis clavier (F1-F10) pour accélérer le processus de vente dans les environnements à fort trafic.

## 🔐 Sécurité et Confidentialité
*   **Client-Side Execution :** Aucune donnée commerciale n'est envoyée à des serveurs externes, sauf si l'utilisateur configure ses propres paramètres Supabase.
*   **Sanitized Transport :** Les données sont nettoyées des identifiants locaux (Local IDs) avant d'être téléchargées sur le Cloud pour éviter les conflits de base de données.
