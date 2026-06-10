'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * useDebounce - تأخير تحديث القيمة لتقليل عمليات المعالجة.
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
 * useDebouncedAbortSignal - تم تحسينه لـ React 19 لضمان استقرار المراجع.
 * يحل مشكلة "تجمد الواجهة" عبر منع الحلقات اللانهائية في Dependency Arrays.
 * يعيد كائناً مستقراً لا يتغير إلا عند استقرار القيمة المدخلة.
 */
export function useDebouncedAbortSignal<T>(value: T, delay: number): {
  debouncedValue: T;
  signal: AbortSignal;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [controller, setController] = useState(() => new AbortController());

  useEffect(() => {
    // إنشاء كنترولر جديد لكل عملية بحث جديدة
    const newController = new AbortController();
    
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setController(newController);
    }, delay);

    return () => {
      clearTimeout(handler);
      // إلغاء العملية السابقة فوراً عند كتابة حرف جديد
      newController.abort();
    };
  }, [value, delay]);

  // التغليف بـ useMemo هو المفتاح لمنع حلقات التكرار اللانهائية
  return useMemo(() => ({
    debouncedValue,
    signal: controller.signal,
  }), [debouncedValue, controller]);
}
