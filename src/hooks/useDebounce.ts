'use client';

import { useState, useEffect, useMemo } from 'react';

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
 * useDebouncedAbortSignal - FIXED for React 19 Performance
 * 
 * CRITICAL FIX: Stabilized the return object identity to prevent infinite render loops.
 * The signal is now tied strictly to the debounced cycle completion.
 */
export function useDebouncedAbortSignal<T>(value: T, delay: number): {
  debouncedValue: T;
  signal: AbortSignal;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [controller, setController] = useState(() => new AbortController());

  useEffect(() => {
    const newController = new AbortController();
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setController(newController);
    }, delay);

    return () => {
      clearTimeout(handler);
      newController.abort();
    };
  }, [value, delay]);

  return useMemo(() => ({
    debouncedValue,
    signal: controller.signal,
  }), [debouncedValue, controller]);
}
