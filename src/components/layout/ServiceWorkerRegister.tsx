'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister — Enregistrement souverain.
 * Force l'enregistrement du SW pour valider l'installation PWA.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Nettoyage des anciens workers si nécessaire
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          if (registration.active?.scriptURL.includes('sw.js') === false) {
             registration.unregister();
          }
        }
      });

      // Enregistrement du worker principal
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[iPOS Zen] Service Worker Actif');
        })
        .catch((err) => {
          console.error('[iPOS Zen] Erreur SW:', err);
        });
    }
  }, []);

  return null;
}
