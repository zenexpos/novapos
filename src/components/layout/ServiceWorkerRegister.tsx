'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister — تسجيل ملف الخدمة بشكل نخبوي.
 * التسجيل الصحيح هو المفتاح التقني لظهور زر التثبيت.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // تسجيل الملف من المجلد العام (Public) لضمان الوصول إليه
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('PWA: Service Worker registered on scope:', registration.scope);
        } catch (err) {
          console.warn('PWA: Service Worker registration failed:', err);
        }
      };

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
