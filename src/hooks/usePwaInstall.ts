'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — Système de capture d'événement d'installation avancé iPOS Zen.
 * Utilise un écouteur global pour garantir que l'événement 'beforeinstallprompt' envoyé par le navigateur n'est pas manqué, afin d'activer le bouton d'installation.
 */

let deferredPrompt: any = null;

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Empêche l'affichage automatique du navigateur pour un contrôle programmatique via nos propres boutons
        e.preventDefault();
        deferredPrompt = e;
        // Envoie une notification à tous les composants concernés indiquant que l'application est prête à être installée
        window.dispatchEvent(new Event('pwa-install-ready'));
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        window.dispatchEvent(new Event('pwa-installed'));
    });
}

export function usePwaInstall() {
    const [isInstallable, setIsInstallable] = useState(false);

    const checkStatus = useCallback(() => {
        if (typeof window === 'undefined') return;

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || (window.navigator as any).standalone === true;

        if (isStandalone) {
            setIsInstallable(false);
        } else if (deferredPrompt) {
            setIsInstallable(true);
        }
    }, []);

    useEffect(() => {
        checkStatus();

        const handleReady = () => setIsInstallable(true);
        const handleInstalled = () => setIsInstallable(false);
        const handleInstallTrigger = () => install();

        window.addEventListener('pwa-install-ready', handleReady);
        window.addEventListener('pwa-installed', handleInstalled);
        window.addEventListener('trigger-pwa-install', handleInstallTrigger);
        
        return () => {
            window.removeEventListener('pwa-install-ready', handleReady);
            window.removeEventListener('pwa-installed', handleInstalled);
            window.removeEventListener('trigger-pwa-install', handleInstallTrigger);
        };
    }, [checkStatus]);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                setIsInstallable(false);
                deferredPrompt = null;
            }
        } catch (err) {
            console.error('[PWA] Error during install:', err);
        }
    }, []);

    return { isInstallable, install };
}
