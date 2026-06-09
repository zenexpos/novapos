'use client';

import { useCallback, useState } from 'react';

/**
 * usePrint — نظام طباعة سيادي موحد iPOS Zen.
 * معالجة متقدمة تضمن استقرار التنسيقات للأحجام المختلفة (A4 و 80mm)
 * وتوسيط المحتوى ومنع تداخل واجهة PWA مع المخرجات.
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
    
    // إزالة قيود العرض/الارتفاع للمعاينة لضمان طباعة كاملة
    clone.style.maxHeight = 'none';
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';
    clone.style.transform = 'none';
    clone.style.margin = '0 auto'; // التوسيط
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    
    // تطبيق فئة الحجم المناسبة لـ CSS
    if (options.thermal) {
      clone.classList.add('thermal-receipt');
      clone.style.width = '80mm';
    } else {
      clone.classList.add('a4-receipt');
      clone.style.width = '210mm';
    }

    target.appendChild(clone);

    // تعيين عنوان الوثيقة (يظهر في اسم الملف عند الحفظ كـ PDF)
    const originalTitle = document.title;
    if (options.title) {
      document.title = options.title;
    }
    
    // انتظار رندر المتصفح (خاصة الصور والباركدود) قبل فتح الحوار
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setIsPrinting(false);
    }, 450);
  }, []);

  return { printElement, isPrinting };
}
