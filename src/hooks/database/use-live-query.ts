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
 * useLiveQuery - Domain-specific hook for real-time IndexedDB tracking.
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
    const mountedRef  = useRef(true);

    const stableQuerier = useCallback(querier, deps);
    const refresh = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        mountedRef.current = true;
        setIsLoading(true);
        setError(null);

        const timeout = setTimeout(() => {
            if (mountedRef.current && isLoading) setIsLoading(false);
        }, 8000);

        const observable = liveQuery(stableQuerier);
        const subscription = observable.subscribe({
            next: (val) => {
                if (!mountedRef.current) return;
                setValue(val);
                setIsLoading(false);
                clearTimeout(timeout);
            },
            error: (err) => {
                if (!mountedRef.current) return;
                setError(err instanceof Error ? err : new Error(String(err)));
                setIsLoading(false);
                clearTimeout(timeout);
            },
        });

        return () => {
            mountedRef.current = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [stableQuerier, tick]);

    return { value, isLoading, error, refresh };
}
