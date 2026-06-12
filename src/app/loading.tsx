'use client';

import { ZenLoader } from '@/components/shared/loaders/ZenLoader';

/**
 * Standard Global Loading UI.
 * Prevents FOUC (Flash of Unstyled Content) while IndexedDB is mounting.
 */
export default function GlobalLoading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-6">
                <ZenLoader message="Initialisation des flux sécurisés..." />
                <p className="text-[9px] font-black text-primary/20 uppercase tracking-[0.4em] animate-pulse">
                    iPOS Zen Sovereign Ledger
                </p>
            </div>
        </div>
    );
}
