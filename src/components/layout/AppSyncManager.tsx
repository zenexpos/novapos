'use client';

import { useAppStore, useAppActions } from '@/stores/appStore';
import { useEffect, useRef } from 'react';
import { breadService } from '@/services/bread.service';

/**
 * مكون مسؤول عن إدارة عمليات المزامنة وضمان استقرار التطبيق في وضع الأوفلاين.
 * يقوم أيضاً بتشغيل مهام الأتمتة المجدولة لطلبات الخبز.
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

    // المزامنة الأولية عند التوفر وتشغيل أتمتة الخبز
    useEffect(() => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        if (!companyProfile?.supabase_url || !companyProfile?.supabase_key) return;
        if (isSyncing || initialSyncTriggered.current) return;

        initialSyncTriggered.current = true;
        
        // تشغيل أتمتة الخبز عند البدء
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

    // التفاعل مع استعادة الاتصال
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

    // التفاعل مع استعادة نشاط الصفحة (Check tasks at 23:00 approx)
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

    // دورة المزامنة الدورية (فقط عند توفر الإنترنت)
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
