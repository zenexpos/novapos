/**
 * iPOS Zen — Service Worker (Elite Edition)
 * نظام العمل دون اتصال وإدارة التخزين المؤقت لضمان التثبيت المباشر.
 */

const CACHE_NAME = 'ipos-zen-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/icon.svg',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// تفعيل وتنظيف الذاكرة القديمة
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// مستمع الـ Fetch — الشرط الأساسي لظهور زر التثبيت في Chrome/Edge
self.addEventListener('fetch', (event) => {
    // استراتيجية Stale-while-revalidate للسرعة القصوى
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    // تخزين الصفحات المستعرضة فقط (تجنب الـ API و Supabase)
                    if (event.request.url.startsWith(self.location.origin)) {
                        cache.put(event.request, fetchResponse.clone());
                    }
                    return fetchResponse;
                });
            });
        }).catch(() => {
            // العودة للصفحة الرئيسية عند انقطاع الإنترنت تماماً
            if (event.request.mode === 'navigate') {
                return caches.match('/');
            }
        })
    );
});
