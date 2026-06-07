# iPOS Smart - Système de Vente Local-First

**iPOS Smart** est une application de point de vente (POS) sophistiquée conçue pour fonctionner entièrement dans le navigateur, privilégiant la confidentialité des données et la rapidité des performances. Le système adopte la philosophie **Local-First**, où toutes les données sont stockées et traitées localement pour garantir la continuité du travail même en cas de coupure Internet.

## 🚀 Fonctionnalités Clés

*   **Moteur de Vente Multitâche :** Support de plusieurs paniers simultanés (Brouillons) avec possibilité de suspendre et reprendre les ventes.
*   **Gestion des Dettes et Crédits :** Suivi précis de la mémorisation des clients avec recalcul dynamique du solde basé sur (Ventes - Paiements - Retours).
*   **Système Logistique du Pain :** Fonctionnalité unique pour gérer les commandes récurrentes (quotidiennes ou planifiées) et les convertir automatiquement en dettes enregistrées.
*   **Contrôle Strict des Stocks :** Historique complet (Audit Trail) de chaque mouvement de stock, prévenant les manipulations et garantissant l'exactitude des quantités.
*   **Intelligence Artificielle Intégrée (OCR) :** Numérisation des factures fournisseurs et conversion immédiate en données numériques via Claude AI API.
*   **Précision Financière Absolue :** Utilisation de calculs d'entiers étendus pour éviter les erreurs de virgule flottante dans les opérations arithmétiques.
*   **Synchronisation Cloud Souveraine :** Possibilité de lier l'application à votre propre Supabase pour la sauvegarde et la synchronisation multi-appareils.

## 🛠 Technologies Utilisées

*   **Framework :** Next.js 14 (App Router).
*   **Database :** IndexedDB (via Dexie.js) - Stockage local complet.
*   **State Management :** Zustand (avec persistance).
*   **UI Engine :** Tailwind CSS & ShadCN UI (optimisé pour écrans 1360x768).
*   **Sync :** Supabase (Optionnel).

## 💻 Compatibilité Appareils
L'interface utilisateur a été soigneusement conçue pour s'adapter aux terminaux POS standards, avec des marges réduites et une densité de données accrue pour garantir une visibilité globale sans défilement inutile.
