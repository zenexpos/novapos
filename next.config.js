/**
 * Next.js 16 Configuration — iPOS Zen v2.0
 *
 * Breaking changes Next.js 14 → 16:
 * - output:'export' toujours compatible (static export)
 * - Turbopack stable (activé par défaut dans next dev --turbopack)
 * - params/searchParams sont maintenant async (impact: pages server)
 * - proxy.ts remplace middleware (on n'utilise pas middleware)
 * - React 19.2 intégré
 * - React Compiler (stable, opt-in)
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Static export pour PWA + Electron
    output: 'export',
    trailingSlash: true,
    reactStrictMode: true,

    // Images non optimisées (export statique)
    images: {
        unoptimized: true,
        remotePatterns: [],
    },

    // Turbopack stable en Next.js 16 — désactiver les indicateurs de dev
    devIndicators: false,

    // Compression Brotli/Gzip
    compress: true,

    // Turbopack root configuration pour éviter les avertissements de workspace
    turbopack: {
        root: __dirname,
    },
};

module.exports = nextConfig;
