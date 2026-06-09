/**
 * iPOS Zen — Sovereign Service Worker (Elite Production)
 * المحرك الجوهري لتفعيل خاصية التثبيت والعمل بدون إنترنت.
 */

const CACHE_NAME = 'ipos-zen-v2';
const OFFLINE_URL = '/offline/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// مستمع الـ Fetch إلزامي لمتصفح Chrome لتفعيل زر التثبيت
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});
