'use client';

import React from 'react';
import type { ProductReturn } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Undo2, RotateCcw, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ReturnStatsProps {
    returns?: ProductReturn[];
    isLoading: boolean;
}

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string }) => (
    <Card className="app-card h-full bg-card/40 backdrop-blur-sm border-white/5 rounded-lg group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
            <CardTitle className="text-[10px] font-semibold uppercase text-muted-foreground group-hover:text-primary transition-all duration-500">{title}</CardTitle>
            <div className={cn("p-3 rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
            <div className="text-xl font-semibold tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left mb-1">{value}</div>
            {subtitle && <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/40">{subtitle}</p>}
        </CardContent>
    </Card>
);

export function ReturnStats({ returns, isLoading }: ReturnStatsProps) {
    const stats = React.useMemo(() => {
        if (!returns) return { totalValue: 0, totalRefunded: 0, count: 0, avgReturn: 0 };
        const totalValue = returns.reduce((sum, r) => sum + r.totalReturnValue, 0);
        const totalRefunded = returns.reduce((sum, r) => sum + r.amountRefunded, 0);
        return {
            totalValue,
            totalRefunded,
            count: returns.length,
            avgReturn: returns.length > 0 ? totalValue / returns.length : 0
        };
    }, [returns]);

    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg bg-card/40" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Total Retours" 
                value={formatCurrency(stats.totalValue)} 
                icon={Undo2} 
                colorClass="bg-primary/10 text-primary"
                subtitle={`${stats.count} opérations`}
            />
            <StatCard 
                title="Remboursements" 
                value={formatCurrency(stats.totalRefunded)} 
                icon={RotateCcw} 
                colorClass="bg-emerald-500/10 text-emerald-500"
                subtitle="Cash rendu aux clients"
            />
            <StatCard 
                title="Avoirs Clients" 
                value={formatCurrency(stats.totalValue - stats.totalRefunded)} 
                icon={TrendingDown} 
                colorClass="bg-amber-500/10 text-amber-500"
                subtitle="Déduit des dettes"
            />
            <StatCard 
                title="Panier Moyen Retour" 
                value={formatCurrency(stats.avgReturn)} 
                icon={DollarSign} 
                colorClass="bg-purple-500/10 text-purple-500"
                subtitle="Valeur moyenne par bon"
            />
        </div>
    );
}
