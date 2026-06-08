/**
 * iPOS Zen — Service Worker (Elite Offline Engine)
 * يوفر دعم العمل بدون إنترنت ويتيح ظهور زر التثبيت في المتصفح.
 */

const CACHE_NAME = 'ipos-zen-v2';
const OFFLINE_URL = '/dashboard/';

// أحداث التثبيت
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                OFFLINE_URL,
                '/icon.svg',
                '/manifest.webmanifest'
            ]);
        })
    );
    self.skipWaiting();
});

// أحداث التفعيل وتطهير الكاش القديم
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

// المستمع الأساسي للطلبات (شرط ضروري لظهور زر التثبيت)
self.addEventListener('fetch', (event) => {
    // نكتفي بمرور الطلبات في الوقت الحالي لضمان التوافق
    // مع إمكانية التوسع لاستراتيجيات الكاش المعقدة لاحقاً
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(OFFLINE_URL);
            })
        );
    }
});
