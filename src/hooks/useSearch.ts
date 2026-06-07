'use client';

import { useState, useDeferredValue, useCallback } from 'react';
import { useDebouncedAbortSignal } from './useDebounce';

/**
 * useSearch — Gestion unifiée de la recherche avec debounce + deferred.
 * Évite les re-renders intermédiaires sur frappe rapide.
 */
export function useSearch(initialValue = '', debounceMs = 200) {
    const [query, setQuery] = useState(initialValue);
    const { debouncedValue: debouncedQuery, signal } = useDebouncedAbortSignal(query, debounceMs);
    const deferredQuery     = useDeferredValue(debouncedQuery);

    const clearSearch = useCallback(() => setQuery(''), []);

    return {
        query,
        setQuery,
        debouncedQuery,
        deferredQuery,  // Utiliser pour les filtres coûteux
        clearSearch,
        hasQuery: deferredQuery.length > 0,
        signal,  // Signal AbortController pour les requêtes async
    };
}
