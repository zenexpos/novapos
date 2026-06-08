/**
 * iPOS Zen — Service Worker
 * تفعيل ميزة العمل بدون إنترنت ودعم التثبيت المباشر (PWA).
 */

const CACHE_NAME = 'ipos-zen-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/icon.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
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
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // استراتيجية Network First مع Fallback للكاش لضمان حداثة البيانات
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
