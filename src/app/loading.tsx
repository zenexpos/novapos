'use client';

import { ZenLoader } from '@/components/shared/loaders/ZenLoader';

/**
 * Global loading state for the entire system.
 */
export default function RootLoading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
            <ZenLoader message="Initialisation Elite..." fullScreen />
        </div>
    );
}
