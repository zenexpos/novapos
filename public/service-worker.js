/**
 * iPOS Zen — Service Worker (Elite Edition)
 * نظام إدارة التخزين المؤقت لضمان استمرارية العمل في وضع الأوفلاين.
 */

const CACHE_NAME = 'ipos-zen-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// تثبيت الـ Service Worker وتخزين الأصول الأساسية
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

/**
 * المحرك الأساسي (Fetch Event): 
 * ضروري جداً لظهور زر التثبيت في المتصفحات.
 */
self.addEventListener('fetch', (event) => {
  // تجاوز طلبات الـ API (Supabase) لضمان عدم تعارض المزامنة
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // إذا فشل الاتصال، نحاول إرجاع الصفحة الرئيسية (Offline Support)
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
