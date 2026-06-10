'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

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

export function useAsyncDebounce<T, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  delay: number
): {
  execute: (...args: Args) => void;
  cancel: () => void;
  isPending: boolean;
} {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback((...args: Args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    timeoutRef.current = setTimeout(async () => {
      setIsPending(true);
      try {
        await asyncFn(...args);
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          throw e;
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsPending(false);
        }
      }
    }, delay);
  }, [asyncFn, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPending(false);
  }, []);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return { execute, cancel, isPending };
}

/**
 * useDebouncedAbortSignal - FIXED for React 19
 * Returns a memoized object to prevent infinite re-render loops when used as a dependency.
 */
export function useDebouncedAbortSignal<T>(value: T, delay: number): {
  debouncedValue: T;
  signal: AbortSignal;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const controllerRef = useRef<AbortController>(new AbortController());

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
      // Abort previous request and prepare a fresh controller for the next value change
      controllerRef.current.abort();
      controllerRef.current = new AbortController();
    };
  }, [value, delay]);

  // CRITICAL: useMemo ensures this object doesn't trigger parent effects on every tick
  return useMemo(() => ({
    debouncedValue,
    signal: controllerRef.current.signal,
  }), [debouncedValue]);
}
