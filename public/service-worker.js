/**
 * iPOS Zen — Sovereign Service Worker
 * محرك العمل أوفلاين والشرط الأساسي لتثبيت التطبيق.
 */

const CACHE_NAME = 'ipos-zen-v2';
const OFFLINE_URL = '/offline/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([OFFLINE_URL, '/icon.svg', '/manifest.webmanifest']);
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

// مستمع الـ fetch ضروري جداً لكي يعتبر المتصفح التطبيق "قابل للتثبيت"
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});
