'use client';

import { useState, useEffect } from 'react';

/**
 * مكون الخلفية المتحركة - يتم تحميله فقط في طرف العميل
 * يمنع أخطاء الـ Hydration ويضمن أداءً عالياً.
 */
export function AmbientBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-50 will-change-gpu">
            {/* Orbe 1 */}
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-ambient" />
            
            {/* Orbe 2 */}
            <div className="absolute -bottom-48 -right-32 w-[600px] h-[600px] rounded-full bg-accent/8 blur-[100px] animate-ambient anim-delay-400" />
            
            {/* Orbe 3 Central */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[150px] animate-ambient anim-delay-200" />
        </div>
    );
}
