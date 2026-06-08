import type { MetadataRoute } from 'next';

// For Next.js static export (output: 'export'), keep this route fully static.
export const revalidate = false;

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'iPOS Zen Elite',
        short_name: 'iPOS Elite',
        description: 'Point de Vente intelligent — Elite Solid System',
        start_url: '/sell/',
        display: 'standalone',
        background_color: '#F8FAFC',
        theme_color: '#AFB42B',
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
                name: 'Vente Elite',
                url: '/sell/',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '96x96' }],
            },
            {
                name: 'Dashboard Premium',
                url: '/dashboard/',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '96x96' }],
            },
        ],
        screenshots: [],
    };
}