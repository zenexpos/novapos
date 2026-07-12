
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
 * useLiveQuery v5 — Resilient Production Grade.
 * 
 * Optimized to prevent infinite render loops.
 * 1. Removed state update during render (Textbook cause of "Too many re-renders").
 * 2. Uses deps directly in useEffect with array spreading.
 * 3. Shallow comparison on result to prevent downstream re-renders.
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
    
    // Maintain a stable reference to the latest querier function.
    const querierRef = useRef(querier);
    useEffect(() => {
        querierRef.current = querier;
    });

    const refresh = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        let isSubscribed = true;
        
        // Only set loading if we don't have data to prevent UI flickering on updates
        if (value === undefined) setIsLoading(true);
        setError(null);

        const observable = liveQuery(() => querierRef.current());
        
        const subscription = observable.subscribe({
            next: (val) => {
                if (!isSubscribed) return;
                
                setValue(prev => {
                    // 1. Reference check
                    if (prev === val) return prev;
                    
                    // 2. Shallow comparison for arrays (Standard Dexie result)
                    // This stops the chain of re-renders if DB content is identical
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
                console.error('[useLiveQuery] subscription error:', err);
                setError(err instanceof Error ? err : new Error(String(err)));
                setIsLoading(false);
            },
        });

        return () => {
            isSubscribed = false;
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, ...deps]);

    return { value, isLoading, error, refresh };
}
