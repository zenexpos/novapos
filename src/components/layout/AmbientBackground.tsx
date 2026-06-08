'use client';

import { useState, useEffect } from 'react';

/**
 * مكون الخلفية المتحركة - تم تحسين الألوان لتناسب المظهر الاحترافي الملون
 */
export function AmbientBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40 dark:opacity-20 will-change-gpu">
            {/* Orbe 1 - Primary Amber */}
            <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] animate-ambient" />
            
            {/* Orbe 2 - Blue Accents */}
            <div className="absolute -bottom-48 -right-32 w-[700px] h-[700px] rounded-full bg-blue-500/10 blur-[140px] animate-ambient anim-delay-400" />
            
            {/* Orbe 3 - Emerald Green */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-emerald-500/5 blur-[160px] animate-ambient anim-delay-200" />
        </div>
    );
}