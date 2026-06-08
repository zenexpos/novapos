'use client';

import { useState, useEffect } from 'react';
import { BottomNavBar } from './bottom-navbar';

export function BottomNavBarWrapper() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-20 border-t border-border bg-card/95 md:hidden animate-pulse" />;
    }

    return <BottomNavBar />;
}
