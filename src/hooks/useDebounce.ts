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
 * useDebouncedAbortSignal - تم تحسينه لـ React 19 لضمان استقرار المراجع.
 * يحل مشكلة "تجمد الواجهة" عبر منع الحلقات اللانهائية في Dependency Arrays.
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
      // نغير الكنترولر فقط عند استقرار القيمة
      setController(newController);
    }, delay);

    return () => {
      clearTimeout(handler);
      newController.abort();
    };
  }, [value, delay]);

  // استخدام useMemo لضمان عدم تغيير الكائن المعاد إلا عند تغير الحالة فعلياً
  return useMemo(() => ({
    debouncedValue,
    signal: controller.signal,
  }), [debouncedValue, controller]);
}
