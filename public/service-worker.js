/**
 * iPOS Zen — Sovereign Service Worker
 * الأساس التقني لتفعيل زر التثبيت والعمل دون اتصال.
 */

const CACHE_NAME = 'ipos-zen-v2';
const OFFLINE_URL = '/offline/';

// تفعيل ملف الخدمة فوراً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([OFFLINE_URL]);
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

// مستمع الـ FETCH: ضروري جداً لظهور زر التثبيت في Chrome/Edge
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});
