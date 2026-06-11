# iPOS Zen — Guide de Construction et Production

## Correctifs de Stabilité (Mai 2025)

### 🔴 Système PWA et Hors-ligne (Terminé)
- Ajout de `public/service-worker.js` manuel pour activer l'écouteur `fetch`.
- Configuration de `next.config.js` pour supporter `output: export` en harmonie avec le moteur hors-ligne.
- Sécurisation du hook `useDebounce` pour éviter le gel de l'interface dans les navigateurs.

### 🟡 Système d'Impression Souverain (Terminé)
- **Monochrome A4** : Suppression des couleurs et réduction de la taille de police pour économiser l'encre et garantir le professionnalisme.
- **Thermal 80mm** : Amélioration de la densité et de l'alignement en utilisant des polices `Monospace`.
- **AutoPrint** : Activation de l'impression automatique immédiate après chaque vente (réglable depuis les paramètres).

### 🟢 Compatibilité et Performance
- Mise à niveau vers Next.js 15 (Turbopack) pour une vitesse de construction ultra-rapide.
- Suppression de tous les types `any` dans le moteur de services pour garantir la sécurité des types (Type Safety).

---

## Exécution de la Construction pour la Production

### 1. Construction de la version Web (PWA)
```bash
npm run build        # Produit le dossier out/ prêt à être déployé sur n'importe quel serveur statique
```

### 2. Construction de la version Bureau (Windows EXE)
```bash
npm run electron:build # Construction d'un fichier EXE professionnel pour Windows dans le dossier dist/
```
