'use client';

import { useEffect } from 'react';

/**
 * مكون مسؤول عن تسجيل الـ Service Worker بشكل آمن.
 * التسجيل الصحيح هو مفتاح ظهور زر التثبيت.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('PWA: iPOS Zen Service Worker registered successfully:', registration.scope);
        } catch (err) {
          console.warn('PWA: Service Worker registration failed:', err);
        }
      };

      // التسجيل عند اكتمال تحميل الصفحة لضمان أداء سلس
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  return null;
}
