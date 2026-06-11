import { MetadataRoute } from 'next';

/**
 * Manifeste PWA optimisé pour une installation rapide.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'ipos-zen-v2',
    name: 'iPOS Zen — Gestion Simple',
    short_name: 'iPOS Zen',
    description: 'Système simple et efficace pour la gestion des ventes et du stock',
    start_url: '/',
    scope: '/',
    display: 'standalone',
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
        purpose: 'maskable',
      }
    ],
    shortcuts: [
      {
        name: 'Faire une vente',
        url: '/sell',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      },
      {
        name: 'Voir le stock',
        url: '/products',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      }
    ]
  };
}
