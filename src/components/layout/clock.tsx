'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Clock() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(id);
    }, []);

    if (!now) return null;

    return (
        <div className="hidden xl:flex flex-col items-end leading-tight select-none">
            <span className="text-[11px] font-black tabular-nums text-foreground/80 tracking-tight">
                {format(now, 'HH:mm')}
            </span>
            <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
                {format(now, 'EEE dd MMM', { locale: fr })}
            </span>
        </div>
    );
}
