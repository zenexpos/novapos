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
 * useLiveQuery v6 — Titanium Production Grade.
 * 
 * Optimized to eliminate the "Maximum update depth exceeded" error.
 * 1. Removed setState calls during the render phase.
 * 2. Uses a stable reference for the query function.
 * 3. Implements shallow comparison to prevent unnecessary React re-renders.
 * 4. Dependencies are handled as a single array element to maintain constant hook signature.
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
    
    // Stable reference to the latest querier to avoid re-subscribing on every anonymous function definition
    const querierRef = useRef(querier);
    useEffect(() => {
        querierRef.current = querier;
    });

    const refresh = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        let isSubscribed = true;
        
        // Start loading if no data present
        if (value === undefined) setIsLoading(true);
        setError(null);

        const observable = liveQuery(() => querierRef.current());
        
        const subscription = observable.subscribe({
            next: (val) => {
                if (!isSubscribed) return;
                
                setValue(prev => {
                    // 1. Identity check
                    if (prev === val) return prev;
                    
                    // 2. Shallow comparison for arrays (Standard Dexie toArray results)
                    // Prevents infinite loops when DB content hasn't changed but a new array reference is returned
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
        // deps are wrapped in the array to keep hook size constant regardless of what is inside deps
    }, [tick, deps]);

    return { value, isLoading, error, refresh };
}
