import { MetadataRoute } from 'next';
import { APP_CONFIG } from '@/lib/config/app-config';

/**
 * Enterprise PWA Manifest.
 * Defines visual identity and installability standards.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'ipos-zen-sovereign',
    name: 'iPOS Zen — Point de Vente',
    short_name: 'iPOS Zen',
    description: 'Gestion de point de vente locale et sécurisée.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: APP_CONFIG.pwa.backgroundColor,
    theme_color: APP_CONFIG.pwa.themeColor,
    categories: ['business', 'finance', 'productivity'],
    icons: [
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      }
    ],
    shortcuts: [
      {
        name: 'Vendre',
        url: '/sell',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      },
      {
        name: 'Dettes',
        url: '/debt-alerts',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      }
    ]
  };
}
