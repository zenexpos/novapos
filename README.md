# iPOS Zen — Sovereign Ledger & Elite POS

**iPOS Zen** est un système de point de vente (POS) souverain et luxueux, conçu pour fonctionner entièrement dans le navigateur avec une philosophie **Hors-ligne d'abord (Offline-First)**. Le système offre une expérience utilisateur "Zen" ultra-rapide avec une confidentialité absolue des données.

## 🏗 Structure du projet (Detailed Trunk)

Le système est basé sur des normes d'ingénierie avancées pour assurer l'extensibilité et la haute performance :

### 1. `src/services/` (Business Logic)
- **Domain Driven:** Division des services par domaine (Sales, Inventory, Finance).
- **Service Layer:** Séparation de la logique métier de l'interface utilisateur pour faciliter les tests et la maintenance.

### 2. `src/stores/` (State Management)
- **Atomic State:** Utilisation de Zustand pour diviser l'état en petits stores (Atomic) afin de réduire les re-renders et augmenter la vitesse.
- **Persistence:** Sauvegarde automatique de l'état dans le stockage local pour assurer la continuité du travail.

### 3. `src/lib/` (Core Utilities)
- **Math Engine:** Moteur de calcul financier personnalisé traitant les problèmes de virgule flottante avec une précision comptable.
- **Database Layer:** Moteur Dexie.js pour gérer IndexedDB avec un schéma organisé supportant la synchronisation cloud.

### 4. `public/` (Fortress Offline)
- **PWA Assets:** Système d'icônes et manifeste avancé supportant l'installation sur tous les systèmes d'exploitation.
- **Zen Fallback:** Page hors-ligne dédiée garantissant que l'utilisateur reste dans l'environnement de l'application même en cas de panne totale du réseau.

### 5. `electron/` (Native Desktop)
- **Hardware Bridge:** Communication directe avec les imprimantes thermiques et le tiroir-caisse via les ports USB/Série.
- **Security Policy:** Politiques de sécurité strictes (CSP) pour isoler l'interface web des opérations système sensibles.

## 🛠 Technologie utilisée

*   **Framework :** Next.js 15 (React 19) — mode d'exportation statique (Static Export).
*   **Database :** IndexedDB (via Dexie.js) — stockage local ultra-rapide.
*   **UI Engine :** Tailwind CSS v4 & ShadCN UI — interface conçue pour les écrans POS.
*   **Sync :** Titanium Sync Engine — synchronisation intelligente avec Supabase.

## 💻 Compatibilité et Performance
L'interface a été soigneusement conçue pour s'adapter aux terminaux de vente standard (résolution 1360x768), en mettant l'accent sur la densité des données et en minimisant le besoin de défilement (Politique Zero-Scroll) pour garantir une vision globale du processus commercial.
