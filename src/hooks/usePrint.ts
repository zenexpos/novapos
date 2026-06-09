'use client';

import { useCallback, useState } from 'react';

/**
 * usePrint — Sovereign Unified Printing Engine.
 * Optimized for standalone PWA mode. Centering and high-fidelity rendering.
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

    // Clean and Inject
    target.innerHTML = '';
    const clone = source.cloneNode(true) as HTMLElement;
    
    // Clear preview-only constraints
    clone.style.maxHeight = 'none';
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';
    clone.style.transform = 'none';
    clone.style.margin = '0 auto'; 
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    
    if (options.thermal) {
      clone.classList.add('thermal-receipt');
      clone.style.width = '80mm';
    } else {
      clone.classList.add('a4-receipt');
      clone.style.width = '210mm';
    }

    target.appendChild(clone);

    const originalTitle = document.title;
    if (options.title) {
      document.title = options.title;
    }
    
    // Force a small delay for barcode/image rendering before browser UI takes over
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setIsPrinting(false);
    }, 500);
  }, []);

  return { printElement, isPrinting };
}
