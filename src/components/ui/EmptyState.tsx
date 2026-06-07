'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { SearchX, Plus } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ElementType;
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'search';
}

export function EmptyState({
    icon: Icon, title, description, children, className, variant = 'default',
}: EmptyStateProps) {
    const DisplayIcon = Icon ?? (variant === 'search' ? SearchX : Plus);

    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-20 px-8 text-center',
            'animate-fade-in',
            className,
        )}>
            {/* Icon container */}
            <div className={cn(
                'relative flex items-center justify-center w-20 h-20 rounded-3xl mb-6',
                'bg-[var(--glass-bg)] border border-[var(--glass-border)]',
                'shadow-[var(--glass-shadow)]',
            )}>
                {/* Glow rings */}
                <div className="absolute inset-0 rounded-3xl bg-primary/5 animate-pulse" />
                <DisplayIcon className="h-9 w-9 text-muted-foreground/30 relative z-10" />
            </div>

            <h3 className="text-base font-black uppercase tracking-widest text-foreground mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-sm text-muted-foreground/60 max-w-sm leading-relaxed mb-6">
                    {description}
                </p>
            )}

            {children && (
                <div className="flex items-center gap-3 flex-wrap justify-center">
                    {children}
                </div>
            )}
        </div>
    );
}
