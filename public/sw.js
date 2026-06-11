/**
 * iPOS Zen — Service Worker Manuel pour la détection PWA.
 * Nécessaire pour forcer l'icône d'installation dans la barre d'adresse.
 */
const CACHE_NAME = 'ipos-zen-fortress-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Écouteur fetch minimal requis par Chrome pour afficher le bouton d'installation
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
  }
});
