'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister — التسجيل السيادي لمحرك الأوفلاين.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[iPOS Zen] Offline Fortress Active:', reg.scope);
        })
        .catch((err) => {
          console.error('[iPOS Zen] SW Registration Failed:', err);
        });
    }
  }, []);

  return null;
}
