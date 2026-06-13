'use client';

import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef } from 'react';
import { breadService } from '@/services/bread.service';

/**
 * Gestionnaire de synchronisation stabilisé.
 * Empêche les boucles de rendu infinies lors de l'initialisation.
 */
export function AppSyncManager({ children }: { children: React.ReactNode }) {
    const { fetchCompanyProfile, performBackgroundSync } = useAppActions();
    const companyProfile = useAppStore(state => state.companyProfile);
    
    const initialSyncTriggered = useRef(false);
    const profileFetched = useRef(false);

    // Initial fetch - execute only once
    useEffect(() => {
        if (!profileFetched.current) {
            profileFetched.current = true;
            fetchCompanyProfile();
        }
    }, [fetchCompanyProfile]);

    // Background sync - stabilized dependency check
    useEffect(() => {
        const url = companyProfile?.supabaseUrl;
        const key = companyProfile?.supabaseKey;
        
        if (!url || !key || initialSyncTriggered.current) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        initialSyncTriggered.current = true;
        
        const timeoutId = setTimeout(async () => {
            try {
                // Background tasks that shouldn't block the UI
                await breadService.processEndOfDayTransfers();
                await performBackgroundSync();
            } catch (e) {
                console.warn("[AppSyncManager] Sync warning", e);
            }
        }, 5000);

        return () => clearTimeout(timeoutId);
    }, [companyProfile?.supabaseUrl, companyProfile?.supabaseKey, performBackgroundSync]);

    return <>{children}</>;
}
