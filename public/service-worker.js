// iPOS Zen — Service Worker v2
// FIX: Full offline-first caching with proper activate cleanup and skipWaiting

const CACHE_VERSION = 'v2';
const CACHE_NAME = `ipos-zen-cache-${CACHE_VERSION}`;

// Static shell assets — always available offline
const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/icon.svg',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// ── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    // FIX: skipWaiting so new SW activates immediately without waiting for all tabs to close
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
// FIX: Delete old caches to prevent infinite accumulation in browser storage
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Claim all clients immediately
            self.clients.claim(),
            // Delete all caches that don't match current version
            caches.keys().then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => caches.delete(key))
                )
            ),
        ])
    );
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and non-http(s) schemes
    if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

    // Skip Supabase API calls — always go to network
    if (url.hostname.includes('supabase')) return;

    // Skip Next.js HMR and dev endpoints
    if (url.pathname.startsWith('/_next/webpack-hmr')) return;

    // Strategy: Network-first for HTML navigation, Cache-first for static assets
    if (request.mode === 'navigate') {
        // Network-first for page navigations
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(request).then((cached) => cached || caches.match('/offline.html'))
                )
        );
        return;
    }

    // Cache-first for static assets (_next/static, images, icons, fonts)
    if (
        url.pathname.startsWith('/_next/static') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.woff2')
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Default: Network with cache fallback
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});

// ── UPDATE NOTIFICATION ───────────────────────────────────────────────────────
// Notify all clients when a new SW version is available
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
