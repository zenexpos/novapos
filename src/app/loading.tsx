'use client';

import { ZenLoader } from '@/components/shared/loaders/ZenLoader';

/**
 * Écran de chargement unifié pour les transitions de route iPOS Zen.
 * Garantit une UX fluide pendant le chargement des segments.
 */
export default function GlobalLoading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
            <ZenLoader message="Indexation des flux..." />
        </div>
    );
}
