/**
 * iPOS Zen — Service Worker (Elite Implementation)
 * This file satisfies the PWA install criteria by providing a fetch listener.
 */

const CACHE_NAME = 'ipos-zen-v2';

// 1. Install Event — Prepare for offline
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('[iPOS Zen] Service Worker: Installed');
});

// 2. Activate Event — Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[iPOS Zen] Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

/**
 * 3. Fetch Event — REQUIRED for the PWA install button to appear.
 * Implements a "Network-First, Fallback-to-Cache" strategy for reliability.
 */
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and store in cache for future offline use
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed, serve from cache
        return caches.match(event.request);
      })
  );
});
