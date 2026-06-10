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
 * useDebouncedAbortSignal - FIXED for React 19 Performance
 * 
 * CRITICAL FIX: The previous version returned a new object literal every render,
 * triggering infinite loops in components that used the result as a dependency.
 * Now it uses state for the controller to ensure the returned signal is stable
 * and only invalidates when a new debounced cycle is actually ready.
 */
export function useDebouncedAbortSignal<T>(value: T, delay: number): {
  debouncedValue: T;
  signal: AbortSignal;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  // We use state for the controller so the object reference only changes when we want it to
  const [controller, setController] = useState<AbortController>(new AbortController());

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
      // Abort previous cycle
      controller.abort();
      // Prepare a fresh controller for the NEXT keystroke render
      // This will trigger a re-render but with the correct signal reference
      setController(new AbortController());
    };
  }, [value, delay]);

  // Only return a new object when debouncedValue or controller actually changes
  return useMemo(() => ({
    debouncedValue,
    signal: controller.signal,
  }), [debouncedValue, controller]);
}
