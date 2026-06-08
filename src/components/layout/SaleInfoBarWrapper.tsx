'use client';

import { useState, useEffect } from 'react';
import { SaleInfoBar } from './SaleInfoBar';

export function SaleInfoBarWrapper() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return <SaleInfoBar />;
}
