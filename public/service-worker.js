/**
 * iPOS Zen — Service Worker (Elite Edition)
 * مسؤول عن تمكين العمل بدون إنترنت واستيفاء شروط تثبيت التطبيق.
 */

const CACHE_NAME = 'ipos-zen-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// حدث التثبيت: تخزين الأصول الأساسية
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// حدث التنشيط: تنظيف الذاكرة القديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// حدث الجلب (Fetch): إلزامي لظهور زر التثبيت
self.addEventListener('fetch', (event) => {
  // التفاعل مع الطلبات لضمان استقرار التطبيق
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
