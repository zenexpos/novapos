/**
 * iPOS Zen — Enterprise Service Worker
 * Ce fichier est crucial pour l'installation PWA (déclenche l'icône dans la barre d'adresse).
 */

const CACHE_NAME = 'ipos-zen-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// L'écouteur 'fetch' est obligatoire pour que Chrome affiche l'icône d'installation
self.addEventListener('fetch', (event) => {
  // Stratégie : Network First avec fallback local
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
  }
});

// Gestion des messages (ex: mise à jour)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
