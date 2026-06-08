'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — Capture l'événement d'installation PWA.
 * Amélioré pour éviter de rater l'événement lors des rechargements.
 * Utilise un singleton global pour stocker l'événement de prompt.
 */

let deferredPrompt: any = null;

// Capture l'événement au niveau global (window) dès que possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Empêche l'affichage automatique du navigateur
    e.preventDefault();
    // Stocke l'événement pour usage ultérieur
    deferredPrompt = e;
    // Notifie les composants via un événement personnalisé
    window.dispatchEvent(new Event('pwa-prompt-available'));
    console.log('PWA: Prompt d\'installation capturé et prêt.');
  });
}

export function usePwaInstall() {
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Vérifie si l'application est déjà installée
    const checkStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone === true;

      if (isStandalone) {
        setIsInstallable(false);
        return;
      }

      if (deferredPrompt) {
        setIsInstallable(true);
      }
    };

    checkStatus();

    const handlePromptAvailable = () => setIsInstallable(true);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    
    return () => window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn("PWA: Aucun prompt d'installation disponible.");
      return;
    }

    // Affiche la fenêtre native du navigateur
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: Réponse de l'utilisateur : ${outcome}`);
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
      deferredPrompt = null;
    }
  }, []);

  return { isInstallable, install };
}
