'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * useDebounce - Delays value update.
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
 * useDebouncedAbortSignal - Optimized for React 19 to ensure reference stability.
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
