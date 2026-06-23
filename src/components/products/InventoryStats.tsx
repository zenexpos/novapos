'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, AlertTriangle, PackageX, CalendarClock, TrendingUp, Percent, ShoppingBag, Calendar, Landmark } from 'lucide-react';
import { differenceInDays, startOfDay, startOfMonth } from 'date-fns';
import { formatCurrency, cn, safeNumber, preciseMultiply, calculateMarginRate } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { Product, Sale } from '@/lib/types';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: React.ElementType, colorClass: string, subtitle?: string }) => (
    <Card className="app-card h-full bg-card/40 backdrop-blur-sm border-white/5 rounded-lg group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
            <CardTitle className="text-[10px] font-semibold uppercase text-muted-foreground group-hover:text-primary transition-all duration-500 tracking-widest">{title}</CardTitle>
            <div className={cn("p-3 rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
            <div className="text-2xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left tabular-nums">{value}</div>
            {subtitle && <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40 mt-1">{subtitle}</p>}
        </CardContent>
    </Card>
);

export const InventoryStats = ({ isLoading: externalLoading }: { isLoading?: boolean }) => {
    const productsResult = useLiveQuery<Product[]>(() => db.products.toArray());
    const salesResult = useLiveQuery<Sale[]>(() => db.sales.where('createdAt').above(startOfMonth(new Date())).toArray());
    
    const products = productsResult.value ?? [];
    const salesMonth = salesResult.value ?? [];

    const stats = useMemo(() => {
        if (!products) return { total: 0, active: 0, low: 0, out: 0, expiring: 0, totalValue: 0, totalRetail: 0, avgMargin: 0, soldMonth: 0 };
        const now = startOfDay(new Date());
        
        let totalValAccumulatorCents = 0;
        let totalRetailAccumulatorCents = 0;
        let lowCount = 0;
        let outCount = 0;
        let expiringCount = 0;
        let totalMargin = 0;
        let marginCount = 0;
        let activeCount = 0;

        products.forEach(p => {
            if (p.deletedAt) return;
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

            if (retail > 0) {
                totalMargin += calculateMarginRate(retail, cost);
                marginCount++;
            }

            if (p.dateExpiration) {
                const expDate = startOfDay(new Date(p.dateExpiration));
                const diff = differenceInDays(expDate, now);
                if (diff <= 30) {
                    expiringCount++;
                }
            }
        });

        const soldMonthCount = salesMonth.reduce((acc, s) => s.isCancelled ? acc : acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0);

        return {
            total: products.filter(p => !p.deletedAt).length,
            active: activeCount,
            low: lowCount,
            out: outCount,
            expiring: expiringCount,
            totalValue: totalValAccumulatorCents / 100,
            totalRetail: totalRetailAccumulatorCents / 100,
            avgMargin: marginCount > 0 ? totalMargin / marginCount : 0,
            soldMonth: soldMonthCount
        };
    }, [products, salesMonth]);

    if (productsResult.value === undefined || externalLoading) {
        return (
             <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg bg-card/40" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <StatCard 
                title="Investissement" 
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
                subtitle={`Profit: ${formatCurrency(stats.totalRetail - stats.totalValue)}`} 
            />
            <StatCard 
                title="Marge Elite" 
                value={`${stats.avgMargin.toFixed(1)}%`} 
                icon={Percent} 
                colorClass="bg-violet-500/10 text-violet-500" 
                subtitle="Rentabilité moyenne" 
            />
            <StatCard 
                title="Vendus (Mois)" 
                value={String(Math.round(stats.soldMonth))} 
                icon={ShoppingBag} 
                colorClass="bg-primary/10 text-primary" 
                subtitle="Volume de sortie" 
            />
            <StatCard 
                title="Stock Faible" 
                value={String(stats.low)} 
                icon={AlertTriangle} 
                colorClass="bg-amber-500/10 text-amber-500" 
                subtitle="À commander" 
            />
            <StatCard 
                title="Ruptures" 
                value={String(stats.out)} 
                icon={PackageX} 
                colorClass="bg-red-500/10 text-red-500" 
                subtitle="Ventes perdues" 
            />
            <StatCard 
                title="Catalogue" 
                value={String(stats.total)} 
                icon={Package} 
                colorClass="bg-muted text-muted-foreground" 
                subtitle={`${stats.active} items actifs`} 
            />
            <StatCard 
                title="Péremption" 
                value={String(stats.expiring)} 
                icon={CalendarClock} 
                colorClass="bg-orange-500/10 text-orange-500" 
                subtitle="Moins de 30 jours" 
            />
        </div>
    );
};
