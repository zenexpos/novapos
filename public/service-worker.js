/**
 * iPOS Zen — Sovereign Service Worker (Elite Edition)
 * Provides offline capabilities and enables PWA installation.
 */

const CACHE_NAME = 'ipos-zen-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('[iPOS Zen] Service Worker installed.');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  console.log('[iPOS Zen] Service Worker activated and cache cleaned.');
});

/**
 * The 'fetch' listener is mandatory for Chrome/Edge to show the install button.
 */
self.addEventListener('fetch', (event) => {
  // Logic-less fetch listener to satisfy PWA criteria
  // All assets are served normally unless offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline/');
      })
    );
  }
});
