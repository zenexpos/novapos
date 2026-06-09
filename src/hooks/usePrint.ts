'use client';

import { useCallback, useState } from 'react';

/**
 * usePrint — نظام طباعة سيادي موحد.
 * يقوم بحقن المحتوى في حاوية الطباعة المخصصة وتشغيل نافذة الطباعة.
 */
export function usePrint() {
  const [isPrinting, setIsPrinting] = useState(false);

  const printElement = useCallback((elementId: string, options: { title?: string } = {}) => {
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
    clone.style.margin = '0';

    target.appendChild(clone);

    // تعيين عنوان الوثيقة (يظهر في اسم الـ PDF المتولد)
    if (options.title) {
      const originalTitle = document.title;
      document.title = options.title;
      
      setTimeout(() => {
        window.print();
        document.title = originalTitle;
        setIsPrinting(false);
      }, 200);
    } else {
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 200);
    }
  }, []);

  return { printElement, isPrinting };
}
