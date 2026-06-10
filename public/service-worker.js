/**
 * iPOS Zen — Sovereign Service Worker (Elite Offline Engine)
 * يضمن هذا الملف عمل التطبيق بدون إنترنت كلياً عبر تخزين كافة الأصول محلياً.
 */

const CACHE_NAME = 'ipos-zen-v2';
const OFFLINE_URL = '/index.html';

// الأصول الأساسية التي يجب تخزينها فوراً
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icons/icon-512x512.png',
  '/globals.css'
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
  // استراتيجية: البحث في الكاش أولاً، ثم الشبكة
  // بالنسبة لطلبات الملاحة (Pages)، نفضل الكاش لضمان السرعة السيادية
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL) || caches.match(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // لا نقوم بتخزين طلبات الـ API أو Supabase في كاش المتصفح العادي
        if (event.request.url.includes('supabase.co')) return fetchResponse;
        
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    }).catch(() => {
      // في حالة الفشل التام والأوفلاين للأصول
      if (event.request.destination === 'image') {
        return caches.match('/icons/icon-192x192.png');
      }
    })
  );
});
