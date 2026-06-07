'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';

/**
 * AppBootstrap — initialisation silencieuse au montage de l'app.
 * Charge le profil entreprise depuis IndexedDB sans bloquer le rendu.
 */
export function AppBootstrap({ children }: { children?: React.ReactNode }) {
    const fetchCompanyProfile = useAppStore(s => s.actions.fetchCompanyProfile);

    useEffect(() => {
        fetchCompanyProfile();
    }, [fetchCompanyProfile]);

    return <>{children}</>;
}
