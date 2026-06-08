'use client';

import { useEffect } from 'react';

/**
 * مكون مسؤول عن تسجيل الـ Service Worker بشكل آمن ونخبوي.
 * التسجيل الصحيح هو المفتاح التقني لظهور زر التثبيت الذهبي.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // تسجيل الملف من المجلد العام (Public)
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('PWA: Service Worker active on scope:', registration.scope);
        } catch (err) {
          console.warn('PWA: Registration critical failure:', err);
        }
      };

      // التأكد من التسجيل بعد اكتمال تحميل الصفحة لضمان استقرار الـ Hydration
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
