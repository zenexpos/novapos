'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from './header';

/**
 * AppHeaderWrapper - Garantit que l'en-tête n'est rendu que sur le client.
 * Prévient les erreurs d'hydratation Next.js liées aux états dynamiques (Réseau, Heure).
 */
export function AppHeaderWrapper() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <header className="h-14 border-b border-border bg-card animate-pulse flex items-center px-4">
                <div className="w-8 h-8 rounded-xl bg-muted" />
                <div className="ml-4 w-32 h-4 rounded bg-muted opacity-20" />
                <div className="ml-auto flex gap-2">
                    <div className="w-20 h-8 rounded-lg bg-muted opacity-10" />
                    <div className="w-10 h-10 rounded-xl bg-muted opacity-10" />
                </div>
            </header>
        );
    }

    return <AppHeader />;
}
