'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    change?: number;
    isLoading: boolean;
    href?: string;
    positiveIsGood?: boolean;
    suffix?: string;
    color?: 'primary' | 'emerald' | 'red' | 'blue' | 'violet' | 'amber';
}

const colorMap = {
    primary: 'from-primary/20 to-primary/5 border-primary/20 text-primary',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-500',
    red:     'from-red-500/20 to-red-500/5 border-red-500/20 text-red-500',
    blue:    'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-500',
    violet:  'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-500',
    amber:   'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-500',
};

/**
 * PRODUCTION OPTIMIZATION: Memoized Stat Card.
 * UI AUDIT: Standardized font weights and added better hover affordance.
 */
const StatCardComponent = ({
    title, value, icon: Icon, change, isLoading,
    href, positiveIsGood = true, suffix, color = 'primary',
}: StatCardProps) => {
    const isPositive = change !== undefined && change >= 0;
    const isGood     = positiveIsGood ? isPositive : !isPositive;
    const iconColors = colorMap[color];

    const content = (
        <Card className="glass group h-full transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] border-border/40 relative overflow-hidden rounded-[1.5rem]">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700", iconColors)} />
            
            <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                        'flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-500',
                        'bg-background group-hover:rotate-3 shadow-inner',
                        iconColors,
                    )}>
                        <Icon className="h-7 w-7" />
                    </div>
                    {change !== undefined && isFinite(change) && (
                        <div className={cn(
                            'flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black border shadow-sm',
                            isGood
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-600 border-red-500/20',
                        )}>
                            {isPositive
                                ? <ArrowUpRight className="h-3 w-3" />
                                : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(change).toFixed(1)}%
                        </div>
                    )}
                </div>

                <div className="space-y-1.5">
                    {isLoading ? (
                        <Skeleton className="h-10 w-32 rounded-lg" />
                    ) : (
                        <div className="flex items-baseline gap-1.5">
                            <p className="text-3xl font-black tracking-tighter tabular-nums text-foreground group-hover:text-primary transition-colors duration-500">
                                {value}
                            </p>
                            {suffix && <span className="text-sm text-muted-foreground font-bold">{suffix}</span>}
                        </div>
                    )}
                    <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mt-1">
                        {title}
                    </p>
                </div>
            </CardContent>
        </Card>
    );

    if (href) return (
        <Link href={href} className="block h-full" aria-label={`Voir les détails de ${title}`}>
            {content}
        </Link>
    );
    return content;
}

export const StatCard = memo(StatCardComponent);