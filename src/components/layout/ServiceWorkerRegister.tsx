'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister — Ensures the sovereign service worker is registered
 * to satisfy PWA installation criteria in Chrome and Edge.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Use the service-worker.js directly for maximum reliability
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((reg) => {
          console.log('[iPOS Zen] Service Worker registered:', reg.scope);
          
          // التفتيش عن تحديثات فورية
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[iPOS Zen] New content available; please refresh.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.error('[iPOS Zen] SW registration failed:', err);
        });
    }
  }, []);

  return null;
}
