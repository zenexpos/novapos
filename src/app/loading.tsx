'use client';

import { ZenLoader } from '@/components/shared/loaders/ZenLoader';

/**
 * Écran de chargement unifié (Enterprise Segment).
 * Prévient les flashs de contenu non stylisé (FOUC) pendant le chargement des données IndexedDB.
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
