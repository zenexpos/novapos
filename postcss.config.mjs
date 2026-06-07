/**
 * PostCSS config — Tailwind CSS v4
 * @tailwindcss/postcss remplace l'ancien plugin tailwindcss dans PostCSS.
 * Tailwind v4 ne nécessite plus de fichier tailwind.config.ts séparé :
 * tout est défini dans globals.css via @theme.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};

export default config;
