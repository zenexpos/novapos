'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
    icon?: React.ElementType;
}

/**
 * UI AUDIT FIX: 
 * - Improved typography scale.
 * - Better spacing on mobile.
 * - Added distinct descriptive contrast.
 */
export function PageHeader({ title, description, children, className, icon: Icon }: PageHeaderProps) {
    return (
        <div className={cn(
            'flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10',
            'animate-in fade-in slide-in-from-top-2 duration-500',
            className
        )}>
            <div className="flex items-center gap-5 min-w-0">
                {Icon && (
                    <div className="
                        flex items-center justify-center w-14 h-14 rounded-2xl shrink-0
                        bg-card border border-border shadow-xl ring-1 ring-black/[0.03]
                    ">
                        <Icon className="h-7 w-7 text-primary" />
                    </div>
                )}
                <div className="min-w-0 space-y-1.5">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tighter truncate text-foreground uppercase leading-none">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-[11px] md:text-xs font-bold text-muted-foreground/70 tracking-widest uppercase opacity-80 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                    {children}
                </div>
            )}
        </div>
    );
}
