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
 * useLiveQuery v4 — Resilient Production Grade.
 * 
 * Fixes "Maximum update depth exceeded" by ensuring state updates only happen when necessary
 * and managing the subscription lifecycle with stable internal triggers.
 */
export function useLiveQuery<T>(
    querier:      () => T | Promise<T>,
    deps:         unknown[] = [],
    defaultValue?: T,
): LiveQueryResult<T> {
    const [value,     setValue]     = useState<T | undefined>(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [error,     setError]     = useState<Error | null>(null);
    const [tick,      setTick]      = useState(0);
    
    // Maintain a stable reference to the latest querier function.
    const querierRef = useRef(querier);
    useEffect(() => {
        querierRef.current = querier;
    });

    // Derived state for internal subscription ID based on shallow dependency comparison.
    // This protects against unstable arrays/objects passed in 'deps'.
    const [subId, setSubId] = useState(0);
    const lastDeps = useRef(deps);
    
    const depsChanged = 
        deps.length !== lastDeps.current.length || 
        !deps.every((v, i) => v === lastDeps.current[i]);

    if (depsChanged) {
        lastDeps.current = deps;
        setSubId(s => s + 1);
    }

    const refresh = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        let isSubscribed = true;
        
        // Reset state for new subscription only if we don't have a value (prevents flickering)
        if (value === undefined) setIsLoading(true);
        setError(null);

        const observable = liveQuery(() => querierRef.current());
        
        const subscription = observable.subscribe({
            next: (val) => {
                if (!isSubscribed) return;
                
                setValue(prev => {
                    // 1. Strict reference equality
                    if (prev === val) return prev;
                    
                    // 2. Shallow comparison for arrays (standard Dexie result type)
                    // This is the critical fix for "Maximum update depth exceeded" loops
                    // caused by Dexie emitting new array instances for identical content.
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
    }, [subId, tick]);

    return { value, isLoading, error, refresh };
}
