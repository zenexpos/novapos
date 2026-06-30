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

export function EmptyState({
    icon: Icon, title, description, children, className, variant = 'default', actionLabel, onAction
}: EmptyStateProps) {
    const DisplayIcon = Icon ?? (variant === 'search' ? SearchX : Plus);

    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-24 px-8 text-center bg-card/10 rounded-[3rem] border border-dashed border-border/50 relative overflow-hidden',
            'animate-in fade-in duration-1000',
            className,
        )}>
            {/* Background elements for depth */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="absolute bottom-0 right-0 p-8 opacity-[0.02]">
                <DisplayIcon size={300} />
            </div>
            
            {/* Icon container */}
            <div className={cn(
                'relative flex items-center justify-center w-28 h-28 rounded-[2rem] mb-10',
                'bg-card border-2 border-border shadow-2xl',
            )}>
                {/* Visual pulse */}
                <div className="absolute inset-0 rounded-[2rem] bg-primary/10 animate-ping opacity-20" />
                <DisplayIcon className="h-12 w-12 text-primary opacity-60 relative z-10" />
            </div>

            <div className="max-w-md space-y-4 relative z-10">
                <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
                    {title}
                </h3>

                {description && (
                    <p className="text-sm font-medium text-muted-foreground/60 leading-relaxed max-w-sm mx-auto">
                        {description}
                    </p>
                )}
            </div>

            <div className="mt-12 flex flex-col gap-6 items-center relative z-10">
                {actionLabel && onAction && (
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-40 transition duration-700" />
                        <Button 
                            onClick={onAction} 
                            size="xl"
                            className="relative rounded-2xl px-12 font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl gap-4 hover:scale-105 transition-all duration-500 bg-primary text-primary-foreground"
                        >
                            <Plus className="h-5 w-5" />
                            {actionLabel}
                            <ArrowRight className="h-4 w-4 ml-2 opacity-30 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        {/* Instructional hint */}
                        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-primary/40 uppercase tracking-widest animate-pulse">
                            <MousePointer2 className="h-3 w-3" /> Clique pour démarrer
                        </div>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}