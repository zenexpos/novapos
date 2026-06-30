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
 * UI AUDIT FIX: 
 * - Legibility check (font sizes boosted).
 * - Better depth and hover effects.
 * - Value contrast enhancement.
 */
const StatCardComponent = ({
    title, value, icon: Icon, change, isLoading,
    href, positiveIsGood = true, suffix, color = 'primary',
}: StatCardProps) => {
    const isPositive = change !== undefined && change >= 0;
    const isGood     = positiveIsGood ? isPositive : !isPositive;
    const iconColors = colorMap[color];

    const content = (
        <Card className="glass group h-full transition-all duration-500 hover:shadow-2xl hover:scale-[1.03] border-border/60 relative overflow-hidden rounded-[2rem]">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.04] group-hover:opacity-[0.1] transition-opacity duration-700", iconColors)} />
            
            <CardContent className="p-7 relative z-10">
                <div className="flex items-start justify-between mb-8">
                    <div className={cn(
                        'flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-500',
                        'bg-background group-hover:rotate-3 shadow-inner ring-1 ring-black/[0.02]',
                        iconColors,
                    )}>
                        <Icon className="h-8 w-8" />
                    </div>
                    {change !== undefined && isFinite(change) && (
                        <div className={cn(
                            'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black border-2 shadow-sm',
                            isGood
                                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-700 border-red-500/20',
                        )}>
                            {isPositive
                                ? <ArrowUpRight className="h-3.5 w-3.5" />
                                : <ArrowDownRight className="h-3.5 w-3.5" />}
                            {Math.abs(change).toFixed(1)}%
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        <Skeleton className="h-11 w-36 rounded-xl" />
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl md:text-4xl font-black tracking-tighter tabular-nums text-foreground group-hover:text-primary transition-colors duration-500">
                                {value}
                            </p>
                            {suffix && <span className="text-base text-muted-foreground font-black opacity-30">{suffix}</span>}
                        </div>
                    )}
                    <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] mt-2">
                        {title}
                    </p>
                </div>
            </CardContent>
        </Card>
    );

    if (href) return (
        <Link href={href} className="block h-full active:scale-[0.98] transition-transform">
            {content}
        </Link>
    );
    return content;
}

export const StatCard = memo(StatCardComponent);