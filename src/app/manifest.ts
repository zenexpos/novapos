import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'iPOS Zen Elite Ledger',
        short_name: 'iPOS Zen',
        description: 'نظام محاسبي سيادي متكامل — إصدار النخبة الصلب',
        start_url: '/',
        display: 'standalone',
        background_color: '#F8FAFC',
        theme_color: '#AFB42B',
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
                purpose: 'any',
            },
        ],
    };
}
