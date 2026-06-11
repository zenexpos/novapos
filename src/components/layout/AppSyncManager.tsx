'use client';

import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef } from 'react';
import { breadService } from '@/services/bread.service';

/**
 * Composant responsable de la gestion des opérations de synchronisation et de la stabilité de l'application en mode hors-ligne.
 * Il exécute également les tâches d'automatisation planifiées.
 */
export function AppSyncManager({ children }: { children: React.ReactNode }) {
    const { fetchCompanyProfile, performBackgroundSync } = useAppActions();
    const companyProfile = useAppStore(state => state.companyProfile);
    const syncStatus = useAppStore(state => state.syncStatus);
    const isSyncing  = syncStatus === 'syncing';
    const initialSyncTriggered = useRef(false);

    useEffect(() => {
        fetchCompanyProfile();
    }, [fetchCompanyProfile]);

    // Synchronisation initiale et tâches d'automatisation
    useEffect(() => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        if (!companyProfile?.supabase_url || !companyProfile?.supabase_key) return;
        if (isSyncing || initialSyncTriggered.current) return;

        initialSyncTriggered.current = true;
        
        // Exécution des tâches métier prioritaires au démarrage
        const triggerAutomation = async () => {
             try {
                await breadService.processEndOfDayTransfers();
             } catch (e) {
                console.warn("[SyncManager] Bread automation skipped", e);
             }
        };
        triggerAutomation();

        const timeoutId = setTimeout(async () => {
            try {
                await performBackgroundSync();
            } catch {
                initialSyncTriggered.current = false;
            }
        }, 3000);
        return () => clearTimeout(timeoutId);
    }, [companyProfile, isSyncing, performBackgroundSync]);

    // Écouteurs de connectivité
    useEffect(() => {
        const handleOnline = () => {
            if (companyProfile?.supabase_url && companyProfile?.supabase_key) {
                performBackgroundSync();
                breadService.processEndOfDayTransfers();
            }
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [performBackgroundSync, companyProfile]);

    return <>{children}</>;
}
