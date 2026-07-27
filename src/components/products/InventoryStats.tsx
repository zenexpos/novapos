'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TriangleAlert, TrendingUp, Percent, Landmark } from 'lucide-react';
import { differenceInDays, startOfDay } from 'date-fns';
import { formatCurrency, cn, safeNumber, preciseMultiply, roundFinancial } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import type { Product } from '@/lib/types';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: React.ElementType, colorClass: string, subtitle?: string }) => (
    <Card className="app-card h-full bg-card/40 backdrop-blur-sm border-white/5 rounded-lg group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-primary transition-all duration-500 tracking-widest">{title}</CardTitle>
            <div className={cn("p-3 rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
            <div className="text-2xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left mb-1 tabular-nums">{value}</div>
            {subtitle && <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40 mt-1">{subtitle}</p>}
        </CardContent>
    </Card>
);

export const InventoryStats = ({ isLoading: externalLoading }: { isLoading?: boolean }) => {
    const productsLive = useLiveQuery<Product[]>(() => db.products.filter(p => !p.deletedAt).toArray(), []);
    const products = productsLive.value ?? [];

    const stats = useMemo(() => {
        if (!products || products.length === 0) return { total: 0, active: 0, low: 0, out: 0, expiring: 0, totalValue: 0, totalRetail: 0, avgMargin: 0 };
        const now = startOfDay(new Date());
        
        let totalValAccumulatorCents = 0;
        let totalRetailAccumulatorCents = 0;
        let lowCount = 0;
        let outCount = 0;
        let expiringCount = 0;
        let activeCount = 0;

        products.forEach(p => {
            const qty = safeNumber(p.quantity);
            const cost = safeNumber(p.purchasePrice);
            const retail = safeNumber(p.price);
            const minStock = safeNumber(p.minStockLevel);

            if (qty > 0) {
                totalValAccumulatorCents += Math.round(preciseMultiply(qty, cost) * 100);
                totalRetailAccumulatorCents += Math.round(preciseMultiply(qty, retail) * 100);
                activeCount++;
            }

            if (qty <= 0) {
                outCount++;
            } else if (qty <= minStock) {
                lowCount++;
            }

            if (p.dateExpiration) {
                const expDate = startOfDay(new Date(p.dateExpiration));
                const diff = differenceInDays(expDate, now);
                if (diff >= 0 && diff <= 30) {
                    expiringCount++;
                }
            }
        });

        const totalValue = totalValAccumulatorCents / 100;
        const totalRetail = totalRetailAccumulatorCents / 100;
        const avgMargin = totalRetail > 0 ? ((totalRetail - totalValue) / totalRetail) * 100 : 0;

        return {
            total: products.length,
            active: activeCount,
            low: lowCount,
            out: outCount,
            expiring: expiringCount,
            totalValue,
            totalRetail,
            avgMargin,
        };
    }, [products]);

    const isLoading = productsLive.isLoading || externalLoading;

    if (isLoading && products.length === 0) {
        return (
             <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg bg-card/40 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-1000">
            <StatCard 
                title="Investissement Stock" 
                value={formatCurrency(stats.totalValue)} 
                icon={Landmark} 
                colorClass="bg-emerald-500/10 text-emerald-500" 
                subtitle="Valeur d'achat (PMP)" 
            />
            <StatCard 
                title="Ventes Potentielles" 
                value={formatCurrency(stats.totalRetail)} 
                icon={TrendingUp} 
                colorClass="bg-blue-500/10 text-blue-500" 
                subtitle={`Profit estimé: ${formatCurrency(roundFinancial(stats.totalRetail - stats.totalValue))}`} 
            />
            <StatCard 
                title="Marge Moyenne" 
                value={`${stats.avgMargin.toFixed(1)}%`} 
                icon={Percent} 
                colorClass="bg-violet-500/10 text-violet-500" 
                subtitle="Rentabilité Elite" 
            />
            <StatCard 
                title="Ruptures & Alertes" 
                value={String(stats.out + stats.low)} 
                icon={TriangleAlert} 
                colorClass="bg-amber-500/10 text-amber-500" 
                subtitle={`${stats.out} ruptures totales`} 
            />
        </div>
    );
};