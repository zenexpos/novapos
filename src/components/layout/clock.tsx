'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Clock Component - Hydration Safe.
 * PRODUCTION AUDIT: Prevents SSR mismatch by deferring rendering until client mount.
 */
export function Clock() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(id);
    }, []);

    if (!now) {
        return (
            <div className="hidden xl:flex flex-col items-end leading-tight select-none opacity-20">
                <span className="text-[11px] font-black tabular-nums tracking-tight">--:--</span>
                <span className="text-[9px] font-semibold uppercase tracking-widest">Chargement...</span>
            </div>
        );
    }

    return (
        <div className="hidden xl:flex flex-col items-end leading-tight select-none animate-in fade-in duration-500">
            <span className="text-[11px] font-black tabular-nums text-foreground/80 tracking-tight">
                {format(now, 'HH:mm')}
            </span>
            <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
                {format(now, 'EEE dd MMM', { locale: fr })}
            </span>
        </div>
    );
}
