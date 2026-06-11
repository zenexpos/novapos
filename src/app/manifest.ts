import { MetadataRoute } from 'next';

/**
 * iPOS Zen — Configuration PWA simplifiée.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'com.iposzen.v2',
    name: 'iPOS Zen — Gestion Facile',
    short_name: 'iPOS Zen',
    description: 'Système simple et efficace pour la gestion des ventes et du stock',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#AFB42B',
    orientation: 'any',
    categories: ['business', 'finance', 'productivity'],
    lang: 'fr-FR',
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
        name: 'Vendre',
        short_name: 'Vendre',
        url: '/sell',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      },
      {
        name: 'Stock',
        short_name: 'Stock',
        url: '/products',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      }
    ]
  };
}
