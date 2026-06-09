/**
 * iPOS Zen — Sovereign Service Worker
 * الأساس التقني لتفعيل زر التثبيت وضمان استمرارية العمل أوفلاين.
 */

const CACHE_NAME = 'ipos-zen-v2';
const OFFLINE_URL = '/offline/';

// 1. التثبيت والتخزين الأولي
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/icons/icon-192x192.png',
        '/icon.svg'
      ]);
    })
  );
  self.skipWaiting();
});

// 2. التفعيل وتنظيف الكاش القديم
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
 * 3. مستمع الـ Fetch (إلزامي لظهور زر التثبيت في Chrome/Edge)
 * يضمن تشغيل التطبيق حتى عند انقطاع الإنترنت.
 */
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
