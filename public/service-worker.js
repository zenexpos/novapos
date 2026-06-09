/**
 * iPOS Zen — Sovereign Service Worker (Elite Edition)
 * Mandatory fetch listener for PWA Installation support in Chrome/Edge.
 */

const CACHE_NAME = 'ipos-zen-v2';
const OFFLINE_URL = '/offline/index.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// MANDATORY: Fetch listener is required for "Install" button to appear.
self.addEventListener('fetch', (event) => {
  // Simple pass-through for static files, Network-First for others
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});
