'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister — تسجيل ملف الخدمة لتمكين PWA.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // تسجيل الملف من المسار العام
          const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/',
          });
          console.log('PWA: Service Worker registered successfully:', registration.scope);
        } catch (err) {
          console.error('PWA: Service Worker registration failed:', err);
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
