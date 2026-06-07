
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Static export pour PWA + Electron
    output: 'export',
    trailingSlash: true,
    reactStrictMode: true,

    // Images non optimisées (export statique)
    images: {
        unoptimized: true,
    },

    // Désactiver les indicateurs de dev
    devIndicators: {
        appIsrStatus: false,
    },

    // Compression Brotli/Gzip
    compress: true,
};

module.exports = nextConfig;
