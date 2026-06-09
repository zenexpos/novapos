'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, X } from 'lucide-react';
import { toast } from 'sonner';

export function PWAUpdateNotifier() {
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
                setRegistration(reg);
                
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateToast(reg);
                            }
                        });
                    }
                });
            });
        }
    }, []);

    const showUpdateToast = (reg: ServiceWorkerRegistration) => {
        toast.info("Une nouvelle version est disponible", {
            description: "iPOS Zen a été mis à jour pour de meilleures performances.",
            duration: Infinity,
            action: {
                label: "Mettre à jour",
                onClick: () => {
                    if (reg.waiting) {
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                        window.location.reload();
                    }
                },
            },
            cancel: {
                label: "Fermer",
                onClick: () => {},
            }
        });
    };

    return null; // Logic-only component for now
}