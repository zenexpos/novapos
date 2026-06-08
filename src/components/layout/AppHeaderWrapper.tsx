'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from './header';

/**
 * AppHeaderWrapper — ensures AppHeader is only rendered on the client
 * to prevent hydration mismatches with route-dependent icons/text.
 */
export function AppHeaderWrapper() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-13 border-b border-border bg-card/95 animate-pulse" />;
    }

    return <AppHeader />;
}
