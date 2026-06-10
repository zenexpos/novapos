'use client';

import { useState, useEffect } from 'react';
import type { NetworkStatus } from '@/lib/types';

/**
 * useNetwork — Titanium Monitor.
 * يراقب جودة الاتصال وحالة الإنترنت للتكيف مع وضع الأوفلاين.
 */
export function useNetwork() {
    const [status, setStatus] = useState<NetworkStatus>('online');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateStatus = () => {
            if (!navigator.onLine) {
                setStatus('offline');
            } else {
                // Check if connection is slow (Degraded)
                const conn = (navigator as any).connection;
                if (conn && (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g')) {
                    setStatus('degraded');
                } else {
                    setStatus('online');
                }
            }
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
        };
    }, []);

    return {
        status,
        isOnline: status !== 'offline',
        isOffline: status === 'offline',
        isDegraded: status === 'degraded'
    };
}
