'use client';

import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef } from 'react';
import { breadService } from '@/services/bread.service';

/**
 * Composant responsable de la gestion des opérations de synchronisation.
 * OPTIMISÉ : Correction de la boucle infinie de rendu.
 */
export function AppSyncManager({ children }: { children: React.ReactNode }) {
    const { fetchCompanyProfile, performBackgroundSync } = useAppActions();
    const companyProfile = useAppStore(state => state.companyProfile);
    const initialSyncTriggered = useRef(false);

    // FIX : On ne récupère le profil qu'une seule fois au montage pour éviter la boucle infinie
    useEffect(() => {
        fetchCompanyProfile();
    }, [fetchCompanyProfile]);

    // Synchronisation initiale stable
    useEffect(() => {
        const url = companyProfile?.supabaseUrl;
        const key = companyProfile?.supabaseKey;
        
        if (!url || !key || initialSyncTriggered.current) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        initialSyncTriggered.current = true;
        
        // Délai de démarrage pour laisser le CPU respirer
        const timeoutId = setTimeout(async () => {
            try {
                await breadService.processEndOfDayTransfers();
                await performBackgroundSync();
            } catch (e) {
                console.warn("[AppSyncManager] Initial sync warning", e);
            }
        }, 5000);

        return () => clearTimeout(timeoutId);
    }, [companyProfile?.supabaseUrl, companyProfile?.supabaseKey, performBackgroundSync]);

    // Écouteur de retour en ligne
    useEffect(() => {
        const handleOnline = () => {
            if (companyProfile?.supabaseUrl && companyProfile?.supabaseKey) {
                performBackgroundSync();
            }
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [performBackgroundSync, companyProfile?.supabaseUrl, companyProfile?.supabaseKey]);

    return <>{children}</>;
}
