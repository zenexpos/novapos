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
 * useLiveQuery v3 — Optimized for React 19 and stability.
 * 
 * Fixes "Maximum update depth exceeded" by ensuring state updates only happen when necessary
 * and managing the subscription lifecycle more precisely.
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
    // This prevents re-subscribing to Dexie just because an inline arrow function was used in the component.
    const querierRef = useRef(querier);
    useEffect(() => {
        querierRef.current = querier;
    });

    const refresh = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        let isSubscribed = true;
        
        // Reset state for new dependency set
        setIsLoading(true);
        setError(null);

        // liveQuery returns an observable that tracks database changes.
        // We use the latest version of the querier from our ref.
        const observable = liveQuery(() => querierRef.current());
        
        const subscription = observable.subscribe({
            next: (val) => {
                if (!isSubscribed) return;
                
                // Batch updates in React 18+ will group these, 
                // but we update value first as it's the primary data.
                setValue(val);
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
        // The spread of deps ensures the subscription restarts only when 
        // the external dependencies of the query actually change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, tick]);

    return { value, isLoading, error, refresh };
}
