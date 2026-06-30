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
 * UI AUDIT: Enhanced vertical rhythm and responsive stack behavior.
 */
export function PageHeader({ title, description, children, className, icon: Icon }: PageHeaderProps) {
    return (
        <div className={cn(
            'flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8',
            'animate-slide-up',
            className
        )}>
            <div className="flex items-center gap-5 min-w-0">
                {Icon && (
                    <div className="
                        flex items-center justify-center w-14 h-14 rounded-2xl shrink-0
                        bg-card border border-border shadow-xl
                    ">
                        <Icon className="h-7 w-7 text-primary" />
                    </div>
                )}
                <div className="min-w-0 space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter truncate text-foreground uppercase">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase opacity-70">
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