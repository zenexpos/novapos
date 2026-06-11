import { MetadataRoute } from 'next';

/**
 * iPOS Zen — Manifest Configuration (Elite Production Edition)
 * Configuration optimisée pour déclencher l'icône d'installation du navigateur.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'com.iposzen.elite',
    name: 'iPOS Zen — Elite Ledger',
    short_name: 'iPOS Zen',
    description: 'Système comptable souverain, robuste et luxueux pour la gestion des ventes et du stock',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#AFB42B',
    orientation: 'any',
    categories: ['business', 'finance', 'productivity'],
    lang: 'fr-DZ',
    dir: 'ltr',
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
        short_name: 'Vendre',
        url: '/sell',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      },
      {
        name: 'État du Stock',
        short_name: 'Stock',
        url: '/products',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      }
    ]
  };
}
