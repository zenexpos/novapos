/**
 * iPOS Zen — Service Worker Manuel.
 * Garantit l'installation (Critère fetch de Chrome).
 */

const CACHE_NAME = 'ipos-zen-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Nécessaire pour que Chrome affiche l'icône d'installation (+)
  // Stratégie simple de passage si hors-ligne
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
