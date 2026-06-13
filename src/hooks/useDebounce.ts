'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * useDebounce - Retarde la mise à jour d'une valeur pour réduire les traitements.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedAbortSignal - Version Elite stabilisée.
 * Garantit qu'un nouveau signal n'est émis que lorsque la valeur se stabilise, 
 * évitant les cascades de re-rendus dans les useLiveQuery.
 */
export function useDebouncedAbortSignal<T>(value: T, delay: number): {
  debouncedValue: T;
  signal: AbortSignal;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const controllerRef = useRef(new AbortController());

  useEffect(() => {
    const handler = setTimeout(() => {
      // On n'annule et recrée le signal QUE si la valeur a effectivement changé après le délai
      controllerRef.current.abort();
      controllerRef.current = new AbortController();
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return useMemo(() => ({
    debouncedValue,
    signal: controllerRef.current.signal,
  }), [debouncedValue]);
}
