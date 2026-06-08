/**
 * iPOS Zen — Service Worker Elite (v2.0)
 * المحرك التقني لتمكين العمل دون اتصال (Offline) وتثبيت التطبيق.
 */

const CACHE_NAME = 'ipos-zen-v2';
const OFFLINE_URL = '/';

// 1. التثبيت الأولي وتجهيز الذاكرة المؤقتة
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([OFFLINE_URL]);
        })
    );
});

// 2. تنظيف الذاكرة القديمة عند التنشيط
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

// 3. المحرك الأساسي: معالجة الطلبات (Fetch)
// هذا القسم ضروري جداً لظهور زر التثبيت في المتصفحات
self.addEventListener('fetch', (event) => {
    // معالجة الطلبات فقط من نفس النطاق وبطريقة GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request).then((response) => {
                return response || caches.match(OFFLINE_URL);
            });
        })
    );
});
