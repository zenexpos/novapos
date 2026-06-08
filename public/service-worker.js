/**
 * iPOS Zen — Service Worker (Elite Offline Engine)
 * المحرك التقني المسؤول عن دعم وضع الأوفلاين وصلاحية التثبيت (PWA Eligibility).
 */

const CACHE_NAME = 'ipos-zen-cache-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/icon.svg',
    '/manifest.webmanifest',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// 1. التثبيت وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. تنظيف الذاكرة القديمة عند التفعيل
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

// 3. مستمع الـ FETCH (إلزامي لظهور زر التثبيت)
self.addEventListener('fetch', (event) => {
    // شرط إلزامي لمتصفحات Chrome و Edge لتمكين التثبيت
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
