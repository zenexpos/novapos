'use client';

import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef, useState } from 'react';
import { breadService } from '@/services/bread.service';

/**
 * iPOS Zen - Core Sync Manager (PRODUCTION AUDIT)
 * Stable initialization sequence: Profile -> Bread Cleanup -> Cloud Sync.
 * Implemented robust hydration and re-render guards.
 */
export function AppSyncManager({ children }: { children: React.ReactNode }) {
    const { fetchCompanyProfile, performBackgroundSync } = useAppActions();
    const companyProfile = useAppStore(state => state.companyProfile);
    
    const initialSyncTriggered = useRef(false);
    const profileFetched = useRef(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !profileFetched.current) {
            profileFetched.current = true;
            fetchCompanyProfile();
        }
    }, [isMounted, fetchCompanyProfile]);

    useEffect(() => {
        if (!isMounted || initialSyncTriggered.current) return;
        
        // Ensure browser is online before background tasks
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        initialSyncTriggered.current = true;
        
        const timeoutId = setTimeout(async () => {
            try {
                // Task A: Process automated bread transfers (Elite Logistics)
                // Use .catch to prevent crash if IndexedDB is still busy
                await breadService.processEndOfDayTransfers().catch(e => console.warn("Bread cleanup skipped:", e));
                
                // Task B: Bi-directional Cloud Sync
                const url = companyProfile?.supabaseUrl;
                const key = companyProfile?.supabaseKey;
                if (url && key) {
                    await performBackgroundSync().catch(e => console.warn("Background sync warning:", e));
                }
                
                console.log("[AppSyncManager] Production boot sequence successful.");
            } catch (e) {
                console.warn("[AppSyncManager] Boot sequence warning:", e);
                initialSyncTriggered.current = false;
            }
        }, 3000); // 3s grace period for DB stability

        return () => clearTimeout(timeoutId);
    }, [isMounted, companyProfile?.supabaseUrl, companyProfile?.supabaseKey, performBackgroundSync]);

    if (!isMounted) return null;

    return <>{children}</>;
}
