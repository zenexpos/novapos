/**
 * iPOS Zen — Elite Service Worker
 * تفعيل ميزة الأوفلاين وظهور زر التثبيت في المتصفح.
 */

const CACHE_NAME = 'ipos-zen-v2';
const OFFLINE_URL = '/index.html';

self.addEventListener('install', (event) => {
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

// مستمع لحدث fetch — ضروري جداً لظهور زر التثبيت في Chrome/Edge
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});
