import { MetadataRoute } from 'next';

/**
 * iPOS Zen — Manifest Configuration (Elite Production Edition)
 * Enhanced with shortcuts, screenshots, and rich metadata for better OS integration.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'iPOS Zen — Elite Ledger',
    short_name: 'iPOS Zen',
    description: 'Système comptable souverain, robuste et luxueux pour la gestion des ventes et du stock - Expérience de bureau complète',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#AFB42B',
    orientation: 'portrait-primary',
    categories: ['business', 'finance', 'productivity'],
    lang: 'fr-DZ',
    dir: 'ltr',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      }
    ],
    shortcuts: [
      {
        name: 'Nouvelle Vente',
        short_name: 'Vendre',
        description: 'Ouvrir l\'interface de vente rapide',
        url: '/sell',
        icons: [{ src: '/icon.svg', sizes: 'any' }]
      },
      {
        name: 'État du Stock',
        short_name: 'Stock',
        description: 'Vérifier l\'inventaire',
        url: '/products',
        icons: [{ src: '/icon.svg', sizes: 'any' }]
      }
    ],
    screenshots: [
      {
        src: 'https://picsum.photos/seed/ipos-wide/1280/720',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Dashboard Elite'
      },
      {
        src: 'https://picsum.photos/seed/ipos-mobile/720/1280',
        sizes: '720x1280',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Interface Vente'
      }
    ]
  };
}
