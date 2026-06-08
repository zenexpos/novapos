/**
 * iPOS Zen — Service Worker Elite
 * مسؤول عن تفعيل ميزة التثبيت (PWA) والعمل في وضع الأوفلاين.
 */

const CACHE_NAME = 'ipos-zen-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
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

/**
 * مستمع حدث fetch — إلزامي لظهور زر التثبيت في Chrome/Edge.
 */
self.addEventListener('fetch', (event) => {
  // استراتيجية التخزين: البحث في الكاش أولاً ثم الشبكة
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
