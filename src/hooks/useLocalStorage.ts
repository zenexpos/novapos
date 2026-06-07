'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * useLocalStorage — Synchronisation React ↔ localStorage typée.
 * - Hydration-safe (SSR: utilise defaultValue jusqu'au montage)
 * - Synchronisation cross-tabs via StorageEvent
 */
export function useLocalStorage<T>(
    key: string,
    defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
    const [storedValue, setStoredValue] = useState<T>(defaultValue);

    // Hydration: lit localStorage uniquement côté client
    useEffect(() => {
        try {
            const item = localStorage.getItem(key);
            if (item !== null) setStoredValue(JSON.parse(item));
        } catch {
            setStoredValue(defaultValue);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    // Sync cross-tabs
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key !== key) return;
            try {
                setStoredValue(e.newValue !== null ? JSON.parse(e.newValue) : defaultValue);
            } catch {
                setStoredValue(defaultValue);
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        setStoredValue(prev => {
            const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
            try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* quota */ }
            return next;
        });
    }, [key]);

    const removeValue = useCallback(() => {
        try { localStorage.removeItem(key); } catch { /* noop */ }
        setStoredValue(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    return [storedValue, setValue, removeValue];
}
