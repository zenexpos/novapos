import { MetadataRoute } from 'next';

/**
 * Manifeste PWA Enterprise.
 * Définit l'identité de l'application et garantit l'installabilité native.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'ipos-zen-app',
    name: 'iPOS Zen — Gestion de Vente Simple',
    short_name: 'iPOS Zen',
    description: 'Système de point de vente rapide et efficace pour commerces de proximité',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#F8FAFC',
    theme_color: '#AFB42B',
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
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      },
      {
        name: 'Journal des Flux',
        url: '/sales-history',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      }
    ]
  };
}
