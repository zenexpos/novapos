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
        return (
            <header className="h-13 border-b border-border bg-card animate-pulse flex items-center px-4">
                <div className="w-8 h-8 rounded-lg bg-muted" />
                <div className="ml-4 w-32 h-4 rounded bg-muted" />
            </header>
        );
    }

    return <AppHeader />;
}