// iPOS Zen — Elite Service Worker v2.0
const CACHE_NAME = 'ipos-zen-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install: Cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: MANDATORY for PWA installation trigger
self.addEventListener('fetch', (event) => {
  // Check for extension or non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
