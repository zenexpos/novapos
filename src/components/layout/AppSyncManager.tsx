'use client';

import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef } from 'react';

/**
 * Composant client gérant la logique de synchronisation globale.
 * FIX: setInterval only runs when Supabase is configured (url + key present)
 * FIX: initialSyncTriggered resets on sync failure so retry is possible
 * FIX: syncDebounceTimeout stored in useRef to avoid leak in React Strict Mode double-mount
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

    // Initial sync — only once, only when Supabase is configured
    useEffect(() => {
        // FIX: Guard — do nothing if Supabase is not configured
        if (!companyProfile?.supabase_url || !companyProfile?.supabase_key) return;
        if (isSyncing || initialSyncTriggered.current) return;

        initialSyncTriggered.current = true;
        const timeoutId = setTimeout(async () => {
            try {
                await performBackgroundSync();
            } catch {
                // FIX: Reset flag on failure so user can retry
                initialSyncTriggered.current = false;
            }
        }, 3000);
        return () => clearTimeout(timeoutId);
    }, [companyProfile, isSyncing, performBackgroundSync]);

    // Sync on network reconnect
    useEffect(() => {
        const handleOnline = () => {
            // FIX: Only sync if Supabase is configured
            if (companyProfile?.supabase_url && companyProfile?.supabase_key) {
                performBackgroundSync();
            }
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [performBackgroundSync, companyProfile]);

    // Sync on tab visibility restore
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' &&
                companyProfile?.supabase_url &&
                companyProfile?.supabase_key &&
                navigator.onLine) {
                performBackgroundSync();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [performBackgroundSync, companyProfile]);

    // Periodic sync every 5 minutes — FIX: only when Supabase configured
    useEffect(() => {
        // FIX: Don't create interval at all if Supabase not configured
        if (!companyProfile?.supabase_url || !companyProfile?.supabase_key) return;

        const SYNC_INTERVAL = 5 * 60 * 1000;
        const intervalId = setInterval(() => {
            if (!companyProfile?.supabase_url) return;
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                performBackgroundSync();
            }
        }, SYNC_INTERVAL);
        return () => clearInterval(intervalId);
    }, [performBackgroundSync, companyProfile]);

    return <>{children}</>;
}
