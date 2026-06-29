'use client';
import React from 'react';
import { cn } traditions from '@/lib/utils';
import { SearchX, Plus, LucideIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'search';
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon: Icon, title, description, children, className, variant = 'default', actionLabel, onAction
}: EmptyStateProps) {
    const DisplayIcon = Icon ?? (variant === 'search' ? SearchX : Plus);

    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-20 px-8 text-center bg-card/10 rounded-3xl border border-dashed border-border/50',
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
                <p className="text-sm text-muted-foreground/60 max-w-sm leading-relaxed mb-10">
                    {description}
                </p>
            )}

            <div className="flex flex-col gap-4 items-center">
                {actionLabel && onAction && (
                    <Button onClick={onAction} className="rounded-2xl h-14 px-10 font-black uppercase text-xs tracking-widest shadow-2xl gap-3 animate-bounce">
                        <Plus className="h-5 w-5" />
                        {actionLabel}
                        <ArrowRight className="h-4 w-4 ml-2 opacity-30" />
                    </Button>
                )}
                {children}
            </div>
        </div>
    );
}