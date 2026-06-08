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
          // Enregistrement depuis la racine du domaine (public/)
          const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/',
          });
          
          console.log('PWA: Service Worker enregistré avec succès scope:', registration.scope);

          // Force la mise à jour si un nouveau SW est disponible
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('PWA: Nouvelle version détectée, rechargement suggéré.');
                }
              };
            }
          };
        } catch (err) {
          console.error('PWA: Échec de l\'enregistrement du Service Worker:', err);
        }
      };

      // Attendre que la page soit complètement chargée
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
