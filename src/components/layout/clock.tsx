'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Clock Component - Hydration Safe.
 * Ne s'affiche qu'après le montage pour éviter les désynchronisations serveur/client.
 */
export function Clock() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(id);
    }, []);

    if (!now) return <div className="w-16 h-8" />; // Placeholder stable

    return (
        <div className="flex flex-col items-end leading-none select-none animate-in fade-in duration-500">
            <span className="text-[10px] font-black tabular-nums text-foreground/80 tracking-tight">
                {format(now, 'HH:mm')}
            </span>
            <span className="text-[7px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                {format(now, 'EEE dd MMM', { locale: fr })}
            </span>
        </div>
    );
}
