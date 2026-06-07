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
 * useLiveQuery v2 — Dexie v4 compatible.
 *
 * Améliorations v2:
 * - `refresh()` exposé pour forcer une re-souscription manuelle
 * - Évite les setState sur composant démonté (React 19 strict mode)
 * - Timeout de 10s pour éviter l'état isLoading infini sur erreur réseau
 * - defaultValue optionnel pour SSR / skeleton immédiat
 *
 * USAGE:
 *   const { value: products, isLoading, error, refresh } =
 *       useLiveQuery(() => db.products.toArray(), []);
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
    const isLoadingRef = useRef(isLoading);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableQuerier = useCallback(querier, deps);

    const refresh = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        mountedRef.current = true;
        isLoadingRef.current = true;
        setIsLoading(true);
        setError(null);

        // Timeout guard: if no result in 10s, clear loading state
        const timeout = setTimeout(() => {
            if (mountedRef.current && isLoadingRef.current) {
                setIsLoading(false);
                isLoadingRef.current = false;
            }
        }, 10_000);

        const observable = liveQuery(stableQuerier);
        const subscription = observable.subscribe({
            next: (val) => {
                if (!mountedRef.current) return;
                setValue(val);
                setIsLoading(false);
                isLoadingRef.current = false;
                setError(null);
                clearTimeout(timeout);
            },
            error: (err) => {
                if (!mountedRef.current) return;
                console.error('[useLiveQuery] error:', err);
                setError(err instanceof Error ? err : new Error(String(err)));
                setIsLoading(false);
                isLoadingRef.current = false;
                clearTimeout(timeout);
            },
        });

        return () => {
            mountedRef.current = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stableQuerier, tick]);

    return { value, isLoading, error, refresh };
}
