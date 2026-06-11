'use client';

import { ZenLoader } from '@/components/shared/loaders/ZenLoader';

/**
 * Écran de chargement unifié pour les transitions de route.
 * Prévient les flashs de contenu non stylisé (FOUC) pendant le chargement des données IndexedDB.
 */
export default function GlobalLoading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
            <ZenLoader message="Initialisation des flux sécurisés..." />
        </div>
    );
}
