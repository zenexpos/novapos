import type { MetadataRoute } from 'next';

// For Next.js static export (output: 'export'), keep this route fully static.
export const revalidate = false;

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'iPOS Zen Elite Ledger',
        short_name: 'iPOS Zen',
        description: 'نظام محاسبي سيادي متكامل — نظام صلب واحترافي لسطح المكتب والجوال',
        start_url: '/dashboard/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'minimal-ui'],
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
                name: 'نقطة البيع Elite',
                url: '/sell/',
                description: 'فتح واجهة البيع السريع',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '96x96' }],
            },
            {
                name: 'لوحة التحكم',
                url: '/dashboard/',
                description: 'عرض الإحصائيات المالية',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '96x96' }],
            },
            {
                name: 'تنبيهات الديون',
                url: '/debt-alerts/',
                description: 'متابعة المستحقات المتأخرة',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '96x96' }],
            }
        ],
    };
}
