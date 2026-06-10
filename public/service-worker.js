/**
 * iPOS Zen — Titanium Offline Fortress v2.9
 * محرك الأوفلاين السيادي لضمان استمرارية العمل بدون إنترنت كلياً.
 */

const CACHE_NAME = 'ipos-zen-v2.9-offline';

// القائمة الأساسية للأصول المطلوبة للتشغيل بدون إنترنت
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // سيقوم Next.js بإضافة ملفات الـ JS والـ CSS آلياً أثناء البناء
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[iPOS SW] Building Offline Fortress...');
      return cache.addAll(STATIC_ASSETS);
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
            console.log('[iPOS SW] Purging obsolete defenses:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استراتيجية Stale-While-Revalidate لضمان السرعة القصوى مع دعم الأوفلاين
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات الـ API الخارجية (Supabase) للتعامل معها برمجياً
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // تحديث الكاش في الخلفية عند توفر الإنترنت
        if (navigator.onLine) {
          fetch(event.request).then((networkResponse) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          });
        }
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // إذا فشل كل شيء، قم بتقديم صفحة الأوفلاين إذا كانت صفحة HTML
        if (event.request.mode === 'navigate') {
          return caches.match('/offline');
        }
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
