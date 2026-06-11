/**
 * iPOS Zen — Bulletproof Service Worker
 * Ce fichier est crucial pour l'installation PWA et le fonctionnement hors-ligne.
 * Il contient l'écouteur 'fetch' obligatoire pour que Chrome affiche l'icône d'installation.
 */

const CACHE_NAME = 'ipos-zen-fortress-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/offline'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// CRITIQUE : L'écouteur fetch est indispensable pour que le navigateur détecte l'app comme installable
self.addEventListener('fetch', (event) => {
  // Stratégie : Network First avec fallback sur le cache pour les actifs statiques
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
