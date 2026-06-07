
/* eslint-disable no-restricted-globals */

// iPOS Zen — Service Worker v2.1 — Offline-First Engine
const CACHE_NAME = 'ipos-zen-cache-v2.1';
const OFFLINE_URL = '/index.html';

// الأصول الأساسية التي يجب تخزينها فوراً
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
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
    // معالجة طلبات GET فقط وتجاهل طلبات Supabase الخارجية للمزامنة
    if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((response) => {
                // تخزين الموارد الجديدة ديناميكياً (مثل صور المنتجات أو ملفات JS الإضافية)
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                // في حالة عدم وجود إنترنت وعدم وجود المورد في الكاش، نعود للصفحة الرئيسية
                if (event.request.mode === 'navigate') {
                    return caches.match(OFFLINE_URL);
                }
            });
        })
    );
});
