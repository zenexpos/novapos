'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

/**
 * Enterprise PWA Update Manager.
 * Detects new service worker versions and prompts for refresh.
 */
export function PWAUpdateNotifier() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const sw = navigator.serviceWorker;

            const onUpdateFound = (reg: ServiceWorkerRegistration) => {
                toast.info("Mise à jour disponible", {
                    description: "Une version plus performante d'iPOS Zen est prête.",
                    duration: Infinity,
                    action: {
                        label: "Installer (Restart)",
                        onClick: () => {
                            if (reg.waiting) {
                                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                            }
                            window.location.reload();
                        },
                    },
                });
            };

            sw.ready.then((reg) => {
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && sw.controller) {
                                onUpdateFound(reg);
                            }
                        });
                    }
                });
            });
        }
    }, []);

    return null;
}
