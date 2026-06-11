'use client';

import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef } from 'react';
import { breadService } from '@/services/bread.service';

/**
 * Composant responsable de la gestion des opérations de synchronisation et de la stabilité de l'application en mode hors-ligne.
 * Il exécute également les tâches d'automatisation planifiées pour les commandes de pain.
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

    // Synchronisation initiale lors de la disponibilité et exécution de l'automatisation du pain
    useEffect(() => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        if (!companyProfile?.supabase_url || !companyProfile?.supabase_key) return;
        if (isSyncing || initialSyncTriggered.current) return;

        initialSyncTriggered.current = true;
        
        // Exécution de l'automatisation du pain au démarrage
        breadService.processEndOfDayTransfers();

        const timeoutId = setTimeout(async () => {
            try {
                await performBackgroundSync();
            } catch {
                initialSyncTriggered.current = false;
            }
        }, 3000);
        return () => clearTimeout(timeoutId);
    }, [companyProfile, isSyncing, performBackgroundSync]);

    // Réaction à la restauration de la connexion
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

    // Réaction à la restauration de l'activité de la page (Vérification des tâches vers 23h00 approx)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                breadService.processEndOfDayTransfers();
                if (companyProfile?.supabase_url && companyProfile?.supabase_key && navigator.onLine) {
                    performBackgroundSync();
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [performBackgroundSync, companyProfile]);

    // Cycle de synchronisation périodique (uniquement si en ligne)
    useEffect(() => {
        if (!companyProfile?.supabase_url || !companyProfile?.supabase_key) return;

        const SYNC_INTERVAL = 5 * 60 * 1000;
        const intervalId = setInterval(() => {
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                performBackgroundSync();
            }
            breadService.processEndOfDayTransfers();
        }, SYNC_INTERVAL);
        return () => clearInterval(intervalId);
    }, [performBackgroundSync, companyProfile]);

    return <>{children}</>;
}
