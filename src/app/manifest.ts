import { MetadataRoute } from 'next';

/**
 * Manifeste PWA Enterprise - iPOS Zen.
 * Définit l'identité visuelle et garantit l'installabilité native sur Desktop et Mobile.
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
    background_color: '#F8FAFC',
    theme_color: '#AFB42B',
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
