'use client';

import { useEffect, useState } from 'react';

/**
 * مكون مسؤول عن تسجيل الـ Service Worker لتمكين العمل بدون إنترنت.
 * Hydration-safe: لا يتم تنفيذه إلا في المتصفح.
 */
export function ServiceWorkerRegister() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
          .then((registration) => {
            console.log('iPOS Zen SW registered:', registration.scope);
          })
          .catch((err) => {
            console.log('SW registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}