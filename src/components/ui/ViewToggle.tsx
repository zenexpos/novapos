'use client';

import React from 'react';
import { LayoutGrid, List, StretchHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export type ViewMode = 'grid' | 'list' | 'compact';

interface ViewToggleProps {
    value: ViewMode;
    onChange: (v: ViewMode) => void;
    modes?: ViewMode[];
    className?: string;
}

const modeConfig: Record<ViewMode, { Icon: React.ElementType; label: string }> = {
    grid:    { Icon: LayoutGrid,          label: 'Vue grille'   },
    list:    { Icon: List,                label: 'Vue liste'    },
    compact: { Icon: StretchHorizontal,   label: 'Vue compacte' },
};

export function ViewToggle({
    value, onChange,
    modes = ['grid', 'list'],
    className,
}: ViewToggleProps) {
    return (
        <TooltipProvider delayDuration={400}>
            <div className={cn(
                'inline-flex items-center gap-0.5 p-1 rounded-xl',
                'bg-[var(--glass-bg)] border border-[var(--glass-border)]',
                'backdrop-blur-sm',
                className,
            )}>
                {modes.map(mode => {
                    const { Icon, label } = modeConfig[mode];
                    const active = value === mode;
                    return (
                        <Tooltip key={mode}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onChange(mode)}
                                    className={cn(
                                        'flex items-center justify-center w-7 h-7 rounded-lg',
                                        'transition-all duration-200',
                                        active
                                            ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                                            : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/40',
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs font-semibold">{label}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
