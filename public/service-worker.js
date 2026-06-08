/**
 * iPOS Zen — Service Worker (Elite Edition)
 * مسؤول عن تمكين العمل في وضع الأوفلاين وتحقيق شروط التثبيت (PWA).
 */

const CACHE_NAME = 'ipos-zen-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تفعيل وتطهير الكاش القديم
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

// مستمع الـ Fetch — ضروري جداً لظهور زر التثبيت في المتصفحات
self.addEventListener('fetch', (event) => {
  // نستجيب من الكاش أولاً، ثم من الشبكة
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
