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

export function PageHeader({ title, description, children, className, icon: Icon }: PageHeaderProps) {
    return (
        <div className={cn(
            'flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5',
            'animate-slide-up',
            className
        )}>
            <div className="flex items-center gap-3 min-w-0">
                {Icon && (
                    <div className="
                        flex items-center justify-center w-9 h-9 rounded-xl shrink-0
                        bg-card/95
                        border border-border
                        shadow-sm
                    ">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                )}
                <div className="min-w-0">
                    <h1 className="text-xl font-black tracking-tight truncate gradient-text">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {children}
                </div>
            )}
        </div>
    );
}
