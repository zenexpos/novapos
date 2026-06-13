'use client';

import { useCallback, useState } from 'react';

/**
 * usePrint — Sovereign Unified Printing Engine.
 * Provides high-fidelity rendering by isolating the content in a root portal.
 * Corrected: Removed hardcoded 210mm width for A4 to allow @page margins to center content correctly.
 */
export function usePrint() {
  const [isPrinting, setIsPrinting] = useState(false);

  const printElement = useCallback((elementId: string, options: { title?: string, thermal?: boolean } = {}) => {
    if (typeof window === 'undefined') return;

    const source = document.getElementById(elementId);
    const target = document.getElementById('receipt-for-print');

    if (!source || !target) {
      console.error('[iPOS Print] Error: Source or Target container missing.', { source, target });
      return;
    }

    setIsPrinting(true);

    // 1. Reset and Clone
    target.innerHTML = '';
    const clone = source.cloneNode(true) as HTMLElement;
    
    // 2. SCRUB UI ELEMENTS & ANIMATIONS
    const items = clone.querySelectorAll('*');
    items.forEach(el => {
        el.classList.remove(
            'animate-in', 'fade-in', 'zoom-in', 'duration-1000', 'duration-700', 'duration-500',
            'slide-in-from-bottom-4', 'slide-in-from-left-4', 'slide-in-from-right-4', 'slide-in-from-top-4',
            'opacity-0', 'hidden', 'scale-90', 'scale-95', 'scale-100', 'scale-105', 'shadow-2xl', 'shadow-xl'
        );
        el.removeAttribute('aria-hidden');
        const style = (el as HTMLElement).style;
        style.opacity = '1';
        style.visibility = 'visible';
        style.transform = 'none';
        style.animation = 'none';
    });

    // 3. APPLY PHYSICAL CONSTRAINTS
    clone.style.maxHeight = 'none';
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';
    clone.style.transform = 'none';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.display = 'block';
    clone.style.opacity = '1';
    clone.style.visibility = 'visible';
    clone.style.background = 'white';
    clone.style.color = 'black';
    
    if (options.thermal) {
      clone.classList.add('thermal-receipt');
      clone.style.width = '80mm';
      clone.style.margin = '0 auto';
    } else {
      clone.classList.add('a4-receipt');
      clone.style.width = '100%'; // Allow @page margins to dictate symmetry
      clone.style.margin = '0';
    }

    target.appendChild(clone);

    const originalTitle = document.title;
    if (options.title) {
      document.title = options.title;
    }
    
    // 4. TRIGGER PRINT
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setIsPrinting(false);
    }, 500);
  }, []);

  return { printElement, isPrinting };
}
