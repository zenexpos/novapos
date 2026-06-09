'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister — التسجيل الموثوق لملف الخدمة.
 * هذا المكون هو المسؤول عن إرسال ملف service-worker.js للمتصفح
 * لتمكين ميزة التثبيت (Installation) والعمل بدون إنترنت.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // تسجيل ملف الخدمة اليدوي لضمان تفعيل الـ Fetch listener
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((reg) => {
          console.log('[iPOS Zen] Service Worker Active:', reg.scope);
          
          // الكشف عن التحديثات
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[iPOS Zen] New version detected.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.error('[iPOS Zen] SW Registration Failed:', err);
        });
    }
  }, []);

  return null;
}
