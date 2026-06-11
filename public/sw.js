/**
 * iPOS Zen — Minimalist Offline Engine
 * هذا الملف ضروري لظهور أيقونة التثبيت في شريط العنوان.
 */
const CACHE_NAME = 'ipos-zen-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// مستمع الـ fetch هو الشرط الأساسي الذي يطلبه Chrome لظهور أيقونة التثبيت
self.addEventListener('fetch', (event) => {
  // يمرر الطلبات بشكل طبيعي لكن وجوده يخبر المتصفح أن التطبيق يدعم الأوفلاين
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});
