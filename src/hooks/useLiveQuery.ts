'use client';

import { liveQuery } from 'dexie';
import { useState, useEffect, useCallback, useRef } from 'react';

export interface LiveQueryResult<T> {
    value:     T | undefined;
    isLoading: boolean;
    error:     Error | null;
    refresh:   () => void;
}

/**
 * useLiveQuery v9 — Titanium Production Grade.
 * Optimization: Uses a stable dependency key to prevent infinite re-subscription loops.
 */
export function useLiveQuery<T>(
    querier:      () => T | Promise<T>,
    deps:         unknown[] = [],
    defaultValue?: T,
): LiveQueryResult<T> {
    const [value, setValue] = useState<T | undefined>(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [tick, setTick] = useState(0);
    
    const querierRef = useRef(querier);
    useEffect(() => {
        querierRef.current = querier;
    });

    const refresh = useCallback(() => setTick(t => t + 1), []);

    // Create a stable string key for dependencies to prevent array-reference-change loops
    const depsKey = JSON.stringify(deps);

    useEffect(() => {
        let isSubscribed = true;
        
        if (value === undefined) setIsLoading(true);
        setError(null);

        const observable = liveQuery(() => querierRef.current());
        
        const subscription = observable.subscribe({
            next: (val) => {
                if (!isSubscribed) return;
                
                setValue(prev => {
                    // Deep check for arrays to prevent unnecessary re-renders
                    if (Array.isArray(prev) && Array.isArray(val)) {
                        if (prev.length === val.length && JSON.stringify(prev) === JSON.stringify(val)) {
                            return prev;
                        }
                    }
                    if (prev === val) return prev;
                    return val;
                });
                
                setIsLoading(false);
                setError(null);
            },
            error: (err) => {
                if (!isSubscribed) return;
                console.error('[iPOS LiveQuery] Audit Failure:', err);
                setError(err instanceof Error ? err : new Error(String(err)));
                setIsLoading(false);
            },
        });

        return () => {
            isSubscribed = false;
            subscription.unsubscribe();
        };
    }, [tick, depsKey]);

    return { value, isLoading, error, refresh };
}
