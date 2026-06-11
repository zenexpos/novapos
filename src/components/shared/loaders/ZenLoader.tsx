'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZenLoaderProps {
    message?: string;
    fullScreen?: boolean;
    className?: string;
}

export function ZenLoader({ message = "Mise à jour du registre...", fullScreen = false, className }: ZenLoaderProps) {
    const content = (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">
                {message}
            </p>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
                {content}
            </div>
        );
    }

    return content;
}
