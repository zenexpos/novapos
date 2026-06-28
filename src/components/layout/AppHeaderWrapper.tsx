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
            <header className="h-14 border-b border-border bg-secondary flex items-center px-4">
                <div className="w-8 h-8 rounded-xl bg-white/10 animate-pulse" />
                <div className="ml-4 w-32 h-4 rounded bg-white/5 animate-pulse" />
                <div className="ml-auto flex gap-2">
                    <div className="w-20 h-8 rounded-lg bg-white/5 animate-pulse" />
                    <div className="w-8 h-8 rounded-xl bg-white/5 animate-pulse" />
                </div>
            </header>
        );
    }

    return <AppHeader />;
}
