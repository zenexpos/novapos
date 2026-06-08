/**
 * iPOS Zen — Service Worker (Elite Edition)
 * يضمن تشغيل التطبيق في وضع الأوفلاين واستيفاء شروط PWA للتثبيت المباشر.
 */

const CACHE_NAME = 'ipos-zen-v2';
const OFFLINE_URL = '/dashboard/';

// أحداث التثبيت - تجهيز الكاش الأساسي
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                OFFLINE_URL,
                '/icon.svg',
                '/icons/icon-192x192.png',
                '/icons/icon-512x512.png'
            ]);
        })
    );
    self.skipWaiting();
});

// أحداث التنشيط - تنظيف الكاش القديم
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

// إدارة الطلبات - يدعم العمل بدون إنترنت
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(OFFLINE_URL);
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
