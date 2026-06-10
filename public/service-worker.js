/**
 * iPOS Zen — Sovereign Offline Engine (v2.1)
 * يضمن هذا الملف عمل التطبيق بدون إنترنت كلياً عبر تخزين كافة الأصول والصفحات.
 */

const CACHE_NAME = 'ipos-zen-fortress-v2';
const OFFLINE_URL = '/offline/';

const ASSETS_TO_CACHE = [
  '/',
  '/offline/',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icon.svg'
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
  // للطلبات التي تخص التنقل (Navigation)، نحاول الشبكة أولاً ثم الكاش
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request) || caches.match(OFFLINE_URL) || caches.match('/');
      })
    );
    return;
  }

  // للأصول الثابتة (JS, CSS, Images)، نستخدم استراتيجية الكاش أولاً
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request).then((fetchResponse) => {
        // تخزين الملفات الجديدة تلقائياً في الكاش لزيادة سرعة المرات القادمة
        if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|woff2)$/)) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      }).catch(() => {
        // إذا فشل كل شيء، نعرض أيقونة افتراضية للصور
        if (event.request.destination === 'image') {
          return caches.match('/icons/icon-192x192.png');
        }
      });
    })
  );
});
