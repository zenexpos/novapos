'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister — التسجيل السيادي لمحرك الأوفلاين.
 * يضمن تسجيل ملف service-worker.js لتمكين التثبيت والعمل بدون إنترنت.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // تسجيل ملف الخدمة اليدوي لضمان تفعيل الـ Fetch listener والعمل أوفلاين كلياً
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          console.log('[iPOS Zen] Offline Engine Active:', reg.scope);
          
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[iPOS Zen] New content available, please refresh.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.error('[iPOS Zen] Service Worker registration failed:', err);
        });
    }
  }, []);

  return null;
}
