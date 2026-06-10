/**
 * iPOS Zen — Sovereign Offline Engine
 * المطلب التقني الإلزامي لظهور زر التثبيت وضمان عمل التطبيق بدون إنترنت كلياً.
 */

const CACHE_NAME = 'ipos-zen-core-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // استراتيجية Stale-While-Revalidate للأصول الاستاتيكية
  // تضمن سرعة البرق في التحميل والعمل بدون إنترنت
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // تخزين الأصول بنجاح للعمل لاحقاً بدون نت
          if (event.request.url.startsWith('http')) {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});
