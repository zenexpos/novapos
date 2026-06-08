'use client';

import { useEffect } from 'react';

/**
 * مكون مسؤول عن تسجيل الـ Service Worker بشكل آمن وتفعيل ميزات الـ PWA.
 * يضمن التوافق مع معايير التثبيت المباشر.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // ننتظر حتى اكتمال تحميل الصفحة لضمان تسجيل هادئ وغير معطل للأداء
      const registerSW = () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('PWA: iPOS Zen Service Worker registered:', registration.scope);
            
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('PWA: New content available, please refresh.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('PWA: Service Worker registration failed:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }
  }, []);

  return null;
}
