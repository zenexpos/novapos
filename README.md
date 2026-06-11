# iPOS Zen — Sovereign Ledger & Elite POS

**iPOS Zen** est un système de point de vente (POS) souverain et luxueux, conçu pour fonctionner entièrement dans le navigateur avec une philosophie **Hors-Ligne d'abord (Offline-First)**. Le système offre une expérience utilisateur "Zen" ultra-rapide avec une confidentialité absolue des données, où toutes les opérations commerciales sont traitées localement sans nécessiter de connexion internet permanente.

## 🚀 Caractéristiques Souveraines

*   **Moteur de vente multi-tâches :** Prise en charge de plusieurs paniers d'achat (sous forme de brouillons) avec possibilité de suspendre et de reprendre les ventes instantanément.
*   **Souveraineté Hors-ligne Absolue :** Grâce à un fichier de service (Service Worker) manuel, l'application fonctionne comme un logiciel local solide même en cas de déconnexion réseau totale.
*   **Gestion des Dettes et Crédits :** Suivi précis des comptes clients avec un système d'alertes intelligent pour les dettes en retard et les limites de crédit.
*   **Système Logistique du Pain :** Une fonctionnalité unique pour gérer les abonnements quotidiens programmés et les convertir automatiquement en écritures comptables.
*   **Contrôle Strict du Stock :** Un journal d'audit complet pour chaque mouvement de stock, empêchant les manipulations et garantissant la précision des quantités.
*   **Intelligence Artificielle Intégrée (OCR) :** Scannez les factures fournisseurs et convertissez-les instantanément en données numériques via le moteur Tesseract avancé.
*   **Synchronisation Cloud Optionnelle :** Connectez l'application à votre propre base de données Supabase pour la sauvegarde et la synchronisation entre appareils.

## 🛠 Technologie Utilisée

*   **Framework :** Next.js 15 (React 19) — Mode d'exportation statique.
*   **Base de données :** IndexedDB (via Dexie.js) — Stockage local ultra-rapide.
*   **UI Engine :** Tailwind CSS v4 & ShadCN UI — Interface optimisée pour les écrans POS standards.
*   **Gestion d'état :** Zustand (avec persistance).
*   **Bureau :** Electron — Pour transformer le système en application de bureau pour Windows.

## 💻 Compatibilité et Performance
L'interface a été soigneusement conçue pour s'adapter aux terminaux POS standards (résolution 1360x768), en mettant l'accent sur la densité des données et en réduisant le besoin de défilement (Politique Zero-Scroll) pour garantir une vue d'ensemble de l'opération commerciale.
