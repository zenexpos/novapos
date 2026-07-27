'use client';

import React from 'react';
import type { ProductReturn } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Undo2, RotateCcw, TrendingDown } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ReturnStatsProps {
    returns?: ProductReturn[];
    isLoading: boolean;
}

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string }) => (
    <Card className="h-full bg-card/30 border-white/5 rounded-lg group overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2.5">
            <CardTitle className="text-[7px] font-black uppercase text-muted-foreground group-hover:text-primary transition-all tracking-widest">{title}</CardTitle>
            <div className={cn("p-1 rounded-md shadow-inner", colorClass)}>
                <Icon className="h-2.5 w-2.5" />
            </div>
        </CardHeader>
        <CardContent className="px-2.5 pb-2.5">
            <div className="text-sm font-black tracking-tighter text-foreground tabular-nums leading-none">{value}</div>
            {subtitle && <p className="text-[6px] font-bold uppercase tracking-wide text-muted-foreground/30 mt-0.5">{subtitle}</p>}
        </CardContent>
    </Card>
);

export function ReturnStats({ returns, isLoading }: ReturnStatsProps) {
    const stats = React.useMemo(() => {
        if (!returns) return { totalValue: 0, totalRefunded: 0, count: 0 };
        const totalValue = returns.reduce((sum, r) => sum + r.totalReturnValue, 0);
        const totalRefunded = returns.reduce((sum, r) => sum + r.amountRefunded, 0);
        return {
            totalValue,
            totalRefunded,
            count: returns.length
        };
    }, [returns]);

    if (isLoading) {
        return (
            <div className="grid gap-1.5 grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg bg-card/20" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-1.5 grid-cols-1 sm:grid-cols-3 animate-in fade-in duration-500">
            <StatCard 
                title="Total Mouvements" 
                value={formatCurrency(stats.totalValue)} 
                icon={Undo2} 
                colorClass="bg-primary/10 text-primary"
                subtitle={`${stats.count} retours`}
            />
            <StatCard 
                title="Remboursements Cash" 
                value={formatCurrency(stats.totalRefunded)} 
                icon={RotateCcw} 
                colorClass="bg-emerald-500/10 text-emerald-500"
                subtitle="Sorties de caisse"
            />
            <StatCard 
                title="Crédits Déduits" 
                value={formatCurrency(stats.totalValue - stats.totalRefunded)} 
                icon={TrendingDown} 
                colorClass="bg-amber-500/10 text-amber-500"
                subtitle="Avoirs clients"
            />
        </div>
    );
}
