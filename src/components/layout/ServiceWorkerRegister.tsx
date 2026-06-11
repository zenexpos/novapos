'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister — Enregistrement souverain du moteur hors-ligne.
 * Assure l'enregistrement du fichier service-worker.js pour permettre l'installation et le fonctionnement sans internet.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Enregistrement manuel du fichier de service pour garantir l'activation du fetch listener et un fonctionnement hors-ligne complet
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          console.log('[iPOS Zen] Offline Fortress Active:', reg.scope);
          
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[iPOS Zen] System update detected, ready for Zen refresh.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.error('[iPOS Zen] Offline Engine Registration Error:', err);
        });
    }
  }, []);

  return null;
}
