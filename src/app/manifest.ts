import { MetadataRoute } from 'next';

/**
 * Manifeste PWA optimisé pour l'installation Enterprise.
 * Assure la visibilité du bouton d'installation sur tous les navigateurs.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'ipos-zen-enterprise',
    name: 'iPOS Zen — Gestion de Vente',
    short_name: 'iPOS Zen',
    description: 'Système de gestion simple et efficace pour commerces',
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
        name: 'Inventaire',
        url: '/products',
        icons: [{ src: '/icon.svg', sizes: '192x192' }]
      }
    ]
  };
}
