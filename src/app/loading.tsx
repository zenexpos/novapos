'use client';

import { Loader2 } from 'lucide-react';
import Image from 'next/image';

/**
 * iPOS Zen - Global Loading State
 * Professional loader with "Zen" branding.
 */
export default function RootLoading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="relative mb-8">
                <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
                <div className="relative h-24 w-24 rounded-3xl bg-card border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                    <Image src="/icon.svg" alt="iPOS Zen" width={64} height={64} className="opacity-80" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">
                    Mise à jour du registre...
                </p>
            </div>
        </div>
    );
}
