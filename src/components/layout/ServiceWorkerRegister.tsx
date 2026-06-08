'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister — Enregistrement du Service Worker.
 * Assure que le fichier public/service-worker.js est chargé.
 * C'est la condition sine qua non pour l'éligibilité PWA.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // تسجيل ملف الخدمة من المسار العام
          const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/',
          });
          
          console.log('PWA: Service Worker registered successfully scope:', registration.scope);

          // التحقق من وجود تحديثات
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('PWA: New version available, please refresh.');
                }
              };
            }
          };
        } catch (err) {
          console.error('PWA: Service Worker registration failed:', err);
        }
      };

      // التسجيل عند جاهزية الصفحة
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
