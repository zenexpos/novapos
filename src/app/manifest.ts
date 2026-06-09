import { MetadataRoute } from 'next';

/**
 * iPOS Zen — Manifest Configuration
 * FIX: Next.js 15 static export requires manifest to be forced static.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'iPOS Zen — Elite Ledger',
    short_name: 'iPOS Zen',
    description: 'نظام محاسبي سيادي صلب وفخم لإدارة المبيعات والمخزون',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#AFB42B',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: 'https://picsum.photos/seed/ipos1/1280/720',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Dashboard Elite',
      },
      {
        src: 'https://picsum.photos/seed/ipos2/720/1280',
        sizes: '720x1280',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Vente Mobile Zen',
      },
    ],
    categories: ['business', 'finance'],
    lang: 'fr-DZ',
    dir: 'ltr',
  };
}
