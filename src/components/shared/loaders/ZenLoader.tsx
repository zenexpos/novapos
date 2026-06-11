'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZenLoaderProps {
    message?: string;
    className?: string;
}

/**
 * Composant de chargement unifié iPOS Zen.
 */
export function ZenLoader({ message = "Traitement en cours...", className }: ZenLoaderProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse mr-[-0.4em]">
                {message}
            </p>
        </div>
    );
}
