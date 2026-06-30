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
 * - Standardized typography for Enterprise feel.
 * - Improved vertical spacing.
 * - Consistent icon scaling.
 */
export function PageHeader({ title, description, children, className, icon: Icon }: PageHeaderProps) {
    return (
        <div className={cn(
            'flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12',
            'animate-in fade-in slide-in-from-top-3 duration-700',
            className
        )}>
            <div className="flex items-center gap-6 min-w-0">
                {Icon && (
                    <div className="
                        flex items-center justify-center w-16 h-16 rounded-[1.8rem] shrink-0
                        bg-card border-2 border-border shadow-xl ring-1 ring-black/[0.04]
                        transition-transform hover:scale-105 duration-500
                    ">
                        <Icon className="h-8 w-8 text-primary" />
                    </div>
                )}
                <div className="min-w-0 space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter truncate text-foreground uppercase leading-none">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-[11px] md:text-sm font-bold text-muted-foreground/60 tracking-[0.15em] uppercase leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-4 shrink-0 flex-wrap justify-end">
                    {children}
                </div>
            )}
        </div>
    );
}