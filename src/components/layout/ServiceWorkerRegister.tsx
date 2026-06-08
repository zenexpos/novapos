'use client';

import { useEffect } from 'react';

/**
 * مكون مسؤول عن تسجيل الـ Service Worker.
 * ضروري لتمكين العمل بدون إنترنت وإظهار زر التثبيت.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
          .then((registration) => {
            console.log('SW: iPOS Zen Registered:', registration.scope);
          })
          .catch((err) => {
            console.error('SW: Registration Failed:', err);
          });
      });
    }
  }, []);

  return null;
}
