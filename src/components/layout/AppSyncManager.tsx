'use client';

import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef } from 'react';
import { breadService } from '@/services/bread.service';

/**
 * iPOS Zen - Core Sync Manager (FORENSIC FIX)
 * Prevents sync-loops and multiple redundant fetches during initial hydration.
 */
export function AppSyncManager({ children }: { children: React.ReactNode }) {
    const { fetchCompanyProfile, performBackgroundSync } = useAppActions();
    const companyProfile = useAppStore(state => state.companyProfile);
    
    // Critical protection against re-render storms
    const initialSyncTriggered = useRef(false);
    const profileFetched = useRef(false);

    // Initial fetch - execute strictly only once
    useEffect(() => {
        if (!profileFetched.current) {
            profileFetched.current = true;
            fetchCompanyProfile();
        }
    }, [fetchCompanyProfile]);

    // Background sync - uses a stable ref for tracking to avoid dependency loops
    useEffect(() => {
        const url = companyProfile?.supabaseUrl;
        const key = companyProfile?.supabaseKey;
        
        if (!url || !key || initialSyncTriggered.current) return;
        
        // Ensure browser is online
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        initialSyncTriggered.current = true;
        
        const timeoutId = setTimeout(async () => {
            try {
                // Sequential background tasks
                await breadService.processEndOfDayTransfers();
                await performBackgroundSync();
            } catch (e) {
                console.warn("[AppSyncManager] Background sync warning", e);
            }
        }, 5000); // 5s delay to let the UI breathe after mount

        return () => clearTimeout(timeoutId);
    }, [companyProfile?.supabaseUrl, companyProfile?.supabaseKey, performBackgroundSync]);

    return <>{children}</>;
}
