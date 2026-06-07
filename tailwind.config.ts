/**
 * tailwind.config.ts — KEPT FOR BACKWARD COMPAT avec certains outils (ESLint plugin, IDE)
 * Dans Tailwind v4, la configuration réelle est dans globals.css via @theme inline.
 * Ce fichier ne produit AUCUN effet sur le build.
 *
 * @see src/app/globals.css — section @theme inline pour la config active
 */
import type { Config } from 'tailwindcss';

const config: Config = {
    // Tailwind v4 : darkMode + content gérés par le moteur CSS
    darkMode: 'class',
    content: [],
    theme: { extend: {} },
    plugins: [],
};

export default config;
