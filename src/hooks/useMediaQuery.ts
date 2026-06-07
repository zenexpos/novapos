'use client';

import { useState, useEffect } from 'react';

/**
 * useMediaQuery — Détecte les breakpoints CSS via window.matchMedia.
 * Hydration-safe: retourne false côté SSR.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const media = window.matchMedia(query);
        setMatches(media.matches);
        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
}

/** Raccourcis sémantiques */
export const useIsMobile   = () => useMediaQuery('(max-width: 640px)');
export const useIsTablet   = () => useMediaQuery('(max-width: 1024px)');
export const useIsDesktop  = () => useMediaQuery('(min-width: 1024px)');
export const usePrefersDark = () => useMediaQuery('(prefers-color-scheme: dark)');
