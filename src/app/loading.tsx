'use client';

import { ZenLoader } from '@/components/shared/loaders/ZenLoader';

/**
 * Standard Next.js Loading State.
 * Fournit un feedback visuel constant pendant les transitions de route.
 */
export default function GlobalLoading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
            <ZenLoader message="Chargement du registre..." />
        </div>
    );
}
