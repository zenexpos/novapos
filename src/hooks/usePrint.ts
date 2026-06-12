'use client';

import { useCallback, useState } from 'react';

/**
 * usePrint — Sovereign Unified Printing Engine.
 * Optimized for standalone PWA mode. Centering and high-fidelity rendering.
 * Fixes blank page issues by copying content to a dedicated portal outside dialogs.
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

    // Clean and Inject
    target.innerHTML = '';
    const clone = source.cloneNode(true) as HTMLElement;
    
    // STRIP ANIMATIONS & PREVIEW CONSTRAINTS
    // Animations cause opacity: 0 during cloning if not stripped
    const items = clone.querySelectorAll('*');
    items.forEach(el => {
        el.classList.remove(
            'animate-in', 'fade-in', 'zoom-in', 'duration-1000', 'duration-700', 'duration-500',
            'slide-in-from-bottom-4', 'slide-in-from-left-4', 'slide-in-from-right-4', 'slide-in-from-top-4',
            'opacity-0', 'hidden'
        );
        el.removeAttribute('aria-hidden');
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.visibility = 'visible';
    });

    clone.style.maxHeight = 'none';
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';
    clone.style.transform = 'none';
    clone.style.margin = '0 auto'; 
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.display = 'block';
    clone.style.opacity = '1';
    clone.style.visibility = 'visible';
    
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
    
    // Force a small delay for DOM synchronization and image rendering
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setIsPrinting(false);
      // Optional: Cleanup portal after print dialog closes
      // target.innerHTML = '';
    }, 500);
  }, []);

  return { printElement, isPrinting };
}