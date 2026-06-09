'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister — Ensures the sovereign service worker is registered
 * to satisfy PWA installation criteria in Chrome and Edge.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((reg) => {
            console.log('[iPOS Zen] Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.error('[iPOS Zen] SW registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
