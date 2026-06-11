'use client';

import { useState, useEffect } from 'react';
import { BottomNavBar } from './bottom-navbar';

export function BottomNavBarWrapper() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-18 border-t border-border bg-card/95 md:hidden" />;
    }

    return <BottomNavBar />;
}
