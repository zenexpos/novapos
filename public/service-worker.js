/**
 * iPOS Zen — Elite Service Worker
 * تفعيل العمل في وضع الأوفلاين وضمان استيفاء شروط التثبيت (PWA)
 */

const CACHE_NAME = 'ipos-zen-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/icon.svg',
  '/manifest.webmanifest',
  '/offline.html'
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

// مستمع الـ fetch ضروري جداً لظهور زر التثبيت في المتصفح
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
