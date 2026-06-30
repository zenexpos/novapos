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
 * - Standardized minimal font size.
 * - Added distinct instructional visual cues.
 * - Enhanced contrast for description.
 */
export function EmptyState({
    icon: Icon, title, description, children, className, variant = 'default', actionLabel, onAction
}: EmptyStateProps) {
    const DisplayIcon = Icon ?? (variant === 'search' ? SearchX : Plus);

    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-24 px-8 text-center bg-card/10 rounded-[3rem] border border-dashed border-border/60 relative overflow-hidden',
            'animate-in fade-in duration-1000',
            className,
        )}>
            {/* Background elements for depth */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
            <div className="absolute bottom-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <DisplayIcon size={320} />
            </div>
            
            {/* Icon container */}
            <div className={cn(
                'relative flex items-center justify-center w-32 h-32 rounded-[2.5rem] mb-10',
                'bg-card border-2 border-border shadow-2xl ring-1 ring-black/[0.02]',
            )}>
                {/* Visual pulse for guidance */}
                <div className="absolute inset-0 rounded-[2.5rem] bg-primary/15 animate-ping opacity-20 duration-[3000ms]" />
                <DisplayIcon className="h-14 w-14 text-primary opacity-70 relative z-10" />
            </div>

            <div className="max-w-md space-y-4 relative z-10">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground leading-none">
                    {title}
                </h3>

                {description && (
                    <p className="text-sm md:text-base font-medium text-muted-foreground/75 leading-relaxed max-w-sm mx-auto">
                        {description}
                    </p>
                )}
            </div>

            <div className="mt-12 flex flex-col gap-6 items-center relative z-10">
                {actionLabel && onAction && (
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-40 transition duration-700" />
                        <Button 
                            onClick={onAction} 
                            size="xl"
                            className="relative rounded-2xl px-12 font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl gap-4 hover:scale-105 transition-all duration-500 bg-primary text-primary-foreground border-none"
                        >
                            <Plus className="h-5 w-5" />
                            {actionLabel}
                            <ArrowRight className="h-4 w-4 ml-2 opacity-40 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        {/* Instructional hint */}
                        <div className="mt-8 flex items-center justify-center gap-2.5 text-[11px] font-black text-primary/50 uppercase tracking-widest animate-pulse">
                            <MousePointer2 className="h-4 w-4" /> Cliquez pour démار الإجراء
                        </div>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
