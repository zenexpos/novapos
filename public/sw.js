/**
 * iPOS Zen — Titanium Offline Fortress v2.9
 * Standalone Service Worker for Production.
 */

const CACHE_NAME = 'ipos-zen-v2.9';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // CRITICAL: Chrome requires a fetch listener to show the PWA install icon
  // iPOS Zen relies on next-pwa for advanced caching, but this file 
  // acts as the primary signal for browser installability.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/offline')));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
