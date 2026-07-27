'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Percent, Landmark, Package } from 'lucide-react';
import { formatCurrency, cn, safeNumber, preciseMultiply, roundFinancial } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import type { Product } from '@/lib/types';

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: React.ElementType, colorClass: string }) => (
    <Card className="h-full border bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
            <CardTitle className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{title}</CardTitle>
            <div className={cn("p-1.5 rounded-lg", colorClass)}>
                <Icon className="h-3 w-3" />
            </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
            <div className="text-base font-black tracking-tight tabular-nums">{value}</div>
        </CardContent>
    </Card>
);

export const InventoryStats = ({ isLoading: externalLoading }: { isLoading?: boolean }) => {
    const productsLive = useLiveQuery<Product[]>(() => db.products.filter(p => !p.deletedAt).toArray(), []);
    const products = productsLive.value ?? [];

    const stats = useMemo(() => {
        if (!products || products.length === 0) return { total: 0, totalValue: 0, totalRetail: 0, avgMargin: 0, lowCount: 0 };
        
        let totalValAccumulatorCents = 0;
        let totalRetailAccumulatorCents = 0;
        let lowCount = 0;

        products.forEach(p => {
            const qty = safeNumber(p.quantity);
            const cost = safeNumber(p.purchasePrice);
            const retail = safeNumber(p.price);

            if (qty > 0) {
                totalValAccumulatorCents += Math.round(preciseMultiply(qty, cost) * 100);
                totalRetailAccumulatorCents += Math.round(preciseMultiply(qty, retail) * 100);
            }
            if (qty <= safeNumber(p.minStockLevel)) lowCount++;
        });

        const totalValue = totalValAccumulatorCents / 100;
        const totalRetail = totalRetailAccumulatorCents / 100;
        const avgMargin = totalRetail > 0 ? ((totalRetail - totalValue) / totalRetail) * 100 : 0;

        return {
            total: products.length,
            totalValue,
            totalRetail,
            avgMargin,
            lowCount
        };
    }, [products]);

    const isLoading = productsLive.isLoading || externalLoading;

    if (isLoading && products.length === 0) {
        return (
             <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-500">
            <StatCard 
                title="Investissement" 
                value={formatCurrency(stats.totalValue)} 
                icon={Landmark} 
                colorClass="bg-emerald-500/10 text-emerald-500" 
            />
            <StatCard 
                title="Ventes Est." 
                value={formatCurrency(stats.totalRetail)} 
                icon={TrendingUp} 
                colorClass="bg-blue-500/10 text-blue-500" 
            />
            <StatCard 
                title="Marge Brute" 
                value={`${stats.avgMargin.toFixed(0)}%`} 
                icon={Percent} 
                colorClass="bg-violet-500/10 text-violet-500" 
            />
            <StatCard 
                title="Alerte Stock" 
                value={String(stats.lowCount)} 
                icon={Package} 
                colorClass="bg-amber-500/10 text-amber-500" 
            />
        </div>
    );
};