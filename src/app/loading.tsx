'use client';

import { Loader2 } from 'lucide-react';

/**
 * État de chargement global iPOS Zen.
 */
export default function GlobalLoading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
            <div className="relative mb-6">
                <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
                <Loader2 className="h-14 w-14 animate-spin text-primary relative z-10" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">
                Chargement...
            </p>
        </div>
    );
}
