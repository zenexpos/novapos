'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { SearchX, Plus, LucideIcon, ArrowRight, MousePointer2 } from 'lucide-react';
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

/**
 * UI AUDIT FIX:
 * - Better visual depth with gradients.
 * - Minimum font size compliant (11px+).
 * - Pulse guidance animation for call-to-action.
 */
export function EmptyState({
    icon: Icon, title, description, children, className, variant = 'default', actionLabel, onAction
}: EmptyStateProps) {
    const DisplayIcon = Icon ?? (variant === 'search' ? SearchX : Plus);

    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-28 px-8 text-center bg-card/10 rounded-[3rem] border border-dashed border-border/60 relative overflow-hidden',
            'animate-in fade-in duration-1000',
            className,
        )}>
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute -bottom-10 -right-10 p-10 opacity-[0.03] pointer-events-none rotate-12">
                <DisplayIcon size={380} />
            </div>
            
            {/* Icon Container */}
            <div className={cn(
                'relative flex items-center justify-center w-36 h-36 rounded-[2.8rem] mb-12',
                'bg-card border-2 border-border shadow-2xl ring-1 ring-black/[0.02]',
            )}>
                <div className="absolute inset-0 rounded-[2.8rem] bg-primary/10 animate-ping opacity-20 duration-[4000ms]" />
                <DisplayIcon className="h-16 w-16 text-primary opacity-80 relative z-10" />
            </div>

            <div className="max-w-md space-y-4 relative z-10">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">
                    {title}
                </h3>

                {description && (
                    <p className="text-base font-medium text-muted-foreground/80 leading-relaxed max-w-sm mx-auto">
                        {description}
                    </p>
                )}
            </div>

            <div className="mt-14 flex flex-col gap-8 items-center relative z-10">
                {actionLabel && onAction && (
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-40 transition duration-700" />
                        <Button 
                            onClick={onAction} 
                            size="xl"
                            className="relative rounded-2xl px-14 shadow-2xl hover:scale-105 transition-all duration-500"
                        >
                            <Plus className="h-5 w-5 mr-1" />
                            {actionLabel}
                            <ArrowRight className="h-4 w-4 ml-4 opacity-40 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <div className="mt-8 flex items-center justify-center gap-3 text-[11px] font-black text-primary/60 uppercase tracking-[0.2em] animate-pulse">
                            <MousePointer2 className="h-4 w-4" /> Cliquez pour commencer
                        </div>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
