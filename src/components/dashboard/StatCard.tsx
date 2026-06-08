'use client';

import React from 'react';
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

export function StatCard({
    title, value, icon: Icon, change, isLoading,
    href, positiveIsGood = true, suffix, color = 'primary',
}: StatCardProps) {
    const isPositive = change !== undefined && change >= 0;
    const isGood     = positiveIsGood ? isPositive : !isPositive;
    const iconColors = colorMap[color];

    const content = (
        <Card className="glass group h-full transition-all duration-500 hover:shadow-xl hover:scale-[1.02] border-white/5 relative overflow-hidden">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5", iconColors)} />
            
            <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                        'flex items-center justify-center w-12 h-12 rounded-2xl border transition-all duration-500',
                        'bg-background group-hover:rotate-6',
                        iconColors,
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {change !== undefined && isFinite(change) && (
                        <div className={cn(
                            'flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-black border',
                            isGood
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-500 border-red-500/20',
                        )}>
                            {isPositive
                                ? <ArrowUpRight className="h-3 w-3" />
                                : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(change).toFixed(1)}%
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    {isLoading ? (
                        <Skeleton className="h-9 w-32 rounded-lg" />
                    ) : (
                        <div className="flex items-baseline gap-1.5">
                            <p className="text-2xl font-black tracking-tighter tabular-nums text-foreground">
                                {value}
                            </p>
                            {suffix && <span className="text-xs text-muted-foreground font-bold">{suffix}</span>}
                        </div>
                    )}
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em]">
                        {title}
                    </p>
                </div>
            </CardContent>
        </Card>
    );

    if (href) return (
        <Link href={href} className="block h-full">
            {content}
        </Link>
    );
    return content;
}
