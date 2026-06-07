import type { MetadataRoute } from 'next';

// For Next.js static export (output: 'export'), keep this route fully static.
export const revalidate = false;

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'iPOS Zen',
        short_name: 'iPOS',
        description: 'Point de Vente intelligent — Local-First',
        start_url: '/sell',
        display: 'standalone',
        background_color: '#0D0804',
        theme_color: '#c07814',
        orientation: 'landscape',
        categories: ['business', 'finance', 'productivity'],
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        shortcuts: [
            {
                name: 'Vente',
                url: '/sell',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '96x96' }],
            },
            {
                name: 'Dashboard',
                url: '/dashboard',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '96x96' }],
            },
            {
                name: 'Produits',
                url: '/products',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '96x96' }],
            },
        ],
        screenshots: [],
    };
}
