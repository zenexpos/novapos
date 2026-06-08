/**
 * iPOS Zen - Elite Ledger Service Worker
 * تفعيل خاصية الـ Offline وظهور زر التثبيت في المتصفح.
 */

const CACHE_NAME = 'ipos-zen-v1';

// نحن لا نحتاج لكاش معقد لأننا نستخدم Static Export، لكن وجود مستمع للـ fetch ضروري للـ PWA
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // الاستراتيجية: الشبكة أولاً، ثم الكاش (لضمان أحدث نسخة دائماً)
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
