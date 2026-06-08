'use client';

import { useEffect } from 'react';

/**
 * مكون مسؤول عن تسجيل الـ Service Worker بشكل آمن.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // ننتظر تحميل الصفحة بالكامل قبل التسجيل لضمان الأداء
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('PWA: iPOS Zen Service Worker registered:', registration.scope);
          })
          .catch((err) => {
            console.warn('PWA: Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
