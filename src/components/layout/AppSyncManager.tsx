'use client';

import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef, useState } from 'react';
import { breadService } from '@/services/bread.service';

/**
 * iPOS Zen - Core Sync Manager (PRODUCTION AUDIT FIX)
 * Prevents sync-loops and multiple redundant fetches during initial hydration.
 * Ensures data consistency for Bread and Cloud modules on startup.
 */
export function AppSyncManager({ children }: { children: React.ReactNode }) {
    const { fetchCompanyProfile, performBackgroundSync } = useAppActions();
    const companyProfile = useAppStore(state => state.companyProfile);
    
    // Safety guards against re-render storms
    const initialSyncTriggered = useRef(false);
    const profileFetched = useRef(false);
    const [isMounted, setIsMounted] = useState(false);

    // 1. Initial Hydration Guard
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 2. Single-shot profile initialization
    useEffect(() => {
        if (isMounted && !profileFetched.current) {
            profileFetched.current = true;
            fetchCompanyProfile();
        }
    }, [isMounted, fetchCompanyProfile]);

    // 3. Sequential Background Tasks (Sync + Bread Logic)
    useEffect(() => {
        const url = companyProfile?.supabaseUrl;
        const key = companyProfile?.supabaseKey;
        
        // Block if no cloud config or if already triggered
        if (!isMounted || !url || !key || initialSyncTriggered.current) return;
        
        // Ensure browser is online before triggering cloud logic
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        initialSyncTriggered.current = true;
        
        const timeoutId = setTimeout(async () => {
            try {
                // Task A: Process automated bread transfers (Logistique)
                await breadService.processEndOfDayTransfers().catch(e => console.warn("Bread cleanup skipped:", e));
                
                // Task B: Bi-directional Titanium Sync
                await performBackgroundSync().catch(e => console.warn("Background sync warning:", e));
                
                console.log("[AppSyncManager] Production boot sequence successful.");
            } catch (e) {
                console.warn("[AppSyncManager] Non-critical boot sequence warning:", e);
                // Allow retry on next mount if necessary
                initialSyncTriggered.current = false;
            }
        }, 5000); // 5s grace period

        return () => clearTimeout(timeoutId);
    }, [isMounted, companyProfile?.supabaseUrl, companyProfile?.supabaseKey, performBackgroundSync]);

    if (!isMounted) return null;

    return <>{children}</>;
}
