import { MetadataRoute } from 'next';

/**
 * Manifeste PWA Enterprise.
 * Définit l'identité de l'application pour l'installation native.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'ipos-zen-app',
    name: 'iPOS Zen — Gestion Simple',
    short_name: 'iPOS Zen',
    description: 'Système de vente simple et efficace pour commerces',
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
        name: 'Vendre',
        url: '/sell',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      },
      {
        name: 'Inventaire',
        url: '/products',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      }
    ]
  };
}
