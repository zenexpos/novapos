'use client';

import { useEffect } from 'react';

/**
 * مكون مسؤول عن تسجيل الـ Service Worker لتمكين العمل بدون إنترنت.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('iPOS Zen SW registered:', registration.scope);
          })
          .catch((err) => {
            console.log('SW registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
