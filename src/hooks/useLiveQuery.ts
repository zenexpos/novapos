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
 * useLiveQuery v7 — Titanium Production Grade.
 * 
 * Optimized to eliminate the "Maximum update depth exceeded" and "Changed size" errors.
 * 1. Constant length dependency array [tick, deps_string].
 * 2. Stable reference for the query function.
 * 3. Deep dependency checking via stringification to prevent unnecessary re-subscribing.
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
    
    // Stable reference to the latest querier
    const querierRef = useRef(querier);
    useEffect(() => {
        querierRef.current = querier;
    });

    const refresh = useCallback(() => setTick(t => t + 1), []);

    // Create a stable string key for dependencies to ensure fixed size and value comparison
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
                    if (prev === val) return prev;
                    if (Array.isArray(prev) && Array.isArray(val)) {
                        if (prev.length === val.length && prev.every((item, i) => item === val[i])) {
                            return prev;
                        }
                    }
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
        // Dependency array has a constant size of 2
    }, [tick, depsKey]);

    return { value, isLoading, error, refresh };
}
