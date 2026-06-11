'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZenLoaderProps {
    message?: string;
    fullScreen?: boolean;
    className?: string;
}

/**
 * مكون التحميل الموحد iPOS Zen Loader
 * يستخدم في شاشات الانتظار والمزامنة.
 */
export function ZenLoader({ message = "جاري معالجة البيانات...", fullScreen = false, className }: ZenLoaderProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center gap-4",
            fullScreen && "h-full w-full",
            className
        )}>
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
