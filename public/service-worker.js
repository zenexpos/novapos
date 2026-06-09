/**
 * iPOS Zen — Sovereign Service Worker
 * محرك التشغيل المستقل لضمان العمل دون اتصال وتفعيل التثبيت المباشر.
 */

const CACHE_NAME = 'ipos-zen-v2';
const OFFLINE_URL = '/offline/';

const ASSETS_TO_CACHE = [
  '/',
  '/offline/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// تثبيت ملف الخدمة وتخزين الأصول الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تنظيف الكاش القديم عند التحديث
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
 * مستمع حدث Fetch — الشرط الأساسي لظهور زر التثبيت في Chrome/Edge.
 * يضمن تشغيل التطبيق في وضع الأوفلاين (Offline-first).
 */
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL) || caches.match('/');
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

// استقبال رسالة التحديث الفوري
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
