'use client';

import { useCallback, useState } from 'react';

/**
 * usePrint — نظام طباعة سيادي موحد.
 * تم تحسينه لضمان استقرار التنسيقات ومنع تداخل واجهة PWA مع المخرجات.
 */
export function usePrint() {
  const [isPrinting, setIsPrinting] = useState(false);

  const printElement = useCallback((elementId: string, options: { title?: string, thermal?: boolean } = {}) => {
    if (typeof window === 'undefined') return;

    const source = document.getElementById(elementId);
    const target = document.getElementById('receipt-for-print');

    if (!source || !target) {
      console.error('[iPOS Print] Error: Source or Target container missing.');
      return;
    }

    setIsPrinting(true);

    // تنظيف الحاوية وحقن المحتوى الجديد
    target.innerHTML = '';
    const clone = source.cloneNode(true) as HTMLElement;
    
    // إزالة قيود الارتفاع والعرض الخاصة بالمعاينة
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    clone.style.transform = 'none';
    clone.style.margin = '0 auto';
    
    if (options.thermal) {
      clone.style.width = '80mm';
    } else {
      clone.style.width = '210mm';
    }

    target.appendChild(clone);

    // تعيين عنوان الوثيقة (يظهر في اسم الـ PDF المتولد)
    const originalTitle = document.title;
    if (options.title) {
      document.title = options.title;
    }
    
    // الانتظار قليلاً لضمان رندر العناصر (خاصة الصور والباركود)
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setIsPrinting(false);
    }, 300);
  }, []);

  return { printElement, isPrinting };
}
