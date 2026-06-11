import { MetadataRoute } from 'next';

/**
 * Manifeste PWA Enterprise - iPOS Zen v2.9.
 * Définit l'identité visuelle et garantit l'installabilité native sur Desktop et Mobile.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'ipos-zen-sovereign',
    name: 'iPOS Zen — Système POS Souverain',
    short_name: 'iPOS Zen',
    description: 'Gestion de point de vente haute performance, 100% hors-ligne et sécurisée.',
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
        name: 'Nouvelle Vente',
        url: '/sell',
        description: 'Démarrer une session de vente immédiate',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      },
      {
        name: 'Alerte Dettes',
        url: '/debt-alerts',
        description: 'Vérifier les créances clients',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      }
    ]
  };
}
