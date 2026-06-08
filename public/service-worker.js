/**
 * iPOS Zen — Service Worker (Elite Edition)
 * المحرك التقني لتمكين التثبيت والعمل في وضع الأوفلاين.
 */

const CACHE_NAME = 'ipos-zen-cache-v1';

// الملفات الأساسية المطلوب تخزينها للعمل أوفلاين
const urlsToCache = [
  '/',
  '/icon.svg',
  '/manifest.webmanifest'
];

// تثبيت ملف الخدمة
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// تفعيل ملف الخدمة وتنظيف الكاش القديم
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
  return self.clients.claim();
});

/**
 * مستمع حدث الـ fetch:
 * هذا هو الجزء الأهم لظهور زر التثبيت في Chrome/Edge.
 * المتصفح يرفض التثبيت إذا لم يجد هذا المستمع.
 */
self.addEventListener('fetch', (event) => {
  // استراتيجية: البحث في الكاش أولاً، ثم الشبكة
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
