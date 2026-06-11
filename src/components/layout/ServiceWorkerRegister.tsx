'use client';

import { useEffect } from 'react';

/**
 * Enregistrement du Service Worker pour activer les fonctionnalités PWA.
 * Nécessaire pour que Chrome affiche l'icône d'installation dans l'URL.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[iPOS Zen] Service Worker Actif');
            
            // Mise à jour automatique si un nouveau worker est en attente
            reg.onupdatefound = () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.onstatechange = () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[iPOS Zen] Nouvelle version disponible');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.error('[iPOS Zen] Erreur enregistrement SW:', err);
          });
      });
    }
  }, []);

  return null;
}
