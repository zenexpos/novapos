/**
 * iPOS Zen — Basic Service Worker
 * Requis pour valider le critère d'installation PWA.
 */
const CACHE_NAME = 'ipos-zen-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Le simple fait d'avoir un fetch listener vide suffit à Chrome 
  // pour valider l'aspect PWA installable.
  // Workbox (via next-pwa) injectera la logique réelle au build.
});
