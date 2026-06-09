/**
 * iPOS Zen — Sovereign Service Worker
 * This file is essential for PWA installability in Chrome and Edge.
 * It provides a fetch handler and basic offline capabilities.
 */

const CACHE_NAME = 'ipos-zen-cache-v1';

// We don't necessarily need to cache everything manually if using next-pwa,
// but we MUST have a fetch listener to satisfy the installability criteria.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Respond with cache or network
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Handle push notifications or background sync if needed in the future
