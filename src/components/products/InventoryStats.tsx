'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, AlertTriangle, PackageX, CalendarClock, TrendingUp } from 'lucide-react';
import { differenceInDays, startOfDay } from 'date-fns';
import { formatCurrency, cn, safeNumber, preciseMultiply } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { Product } from '@/lib/types';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: React.ElementType, colorClass: string, subtitle?: string }) => (
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

export const InventoryStats = ({ isLoading: externalLoading }: { isLoading?: boolean }) => {
    // Surveillance en direct du catalogue pour garantir la mise à jour des valeurs.
    const productsResult = useLiveQuery<Product[]>(() => db.products.toArray());
    const products = productsResult.value ?? [];

    const stats = useMemo(() => {
        if (!products) return { total: 0, low: 0, out: 0, expiring: 0, totalValue: 0 };
        const now = startOfDay(new Date());
        
        let totalValAccumulatorCents = 0;
        let lowCount = 0;
        let outCount = 0;
        let expiringCount = 0;

        products.forEach(p => {
            const qty = safeNumber(p.quantity);
            const cost = safeNumber(p.purchasePrice);
            const minStock = safeNumber(p.minStockLevel);

            if (qty > 0) {
                totalValAccumulatorCents += Math.round(preciseMultiply(qty, cost) * 100);
            }

            if (qty <= 0) {
                outCount++;
            } else if (qty <= minStock) {
                lowCount++;
            }

            if (p.dateExpiration) {
                const expDate = startOfDay(new Date(p.dateExpiration));
                const diff = differenceInDays(expDate, now);
                if (diff <= 30) {
                    expiringCount++;
                }
            }
        });

        return {
            total: products.length,
            low: lowCount,
            out: outCount,
            expiring: expiringCount,
            totalValue: totalValAccumulatorCents / 100
        };
    }, [products]);

    if (productsResult.value === undefined || externalLoading) {
        return (
             <div className="grid gap-6 grid-cols-2 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg bg-card/40" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-5">
            <StatCard 
                title="Catalogue" 
                value={String(stats.total)} 
                icon={Package} 
                colorClass="bg-primary/10 text-primary" 
                subtitle="Produits référencés" 
            />
            <StatCard 
                title="Valeur Stock" 
                value={formatCurrency(stats.totalValue)} 
                icon={TrendingUp} 
                colorClass="bg-emerald-500/10 text-emerald-500" 
                subtitle="Investissement total" 
            />
            <StatCard 
                title="Stock Faible" 
                value={String(stats.low)} 
                icon={AlertTriangle} 
                colorClass="bg-amber-500/10 text-amber-500" 
                subtitle="Réapprovisionnement" 
            />
            <StatCard 
                title="Ruptures" 
                value={String(stats.out)} 
                icon={PackageX} 
                colorClass="bg-destructive/10 text-destructive" 
                subtitle="Ventes perdues" 
            />
            <StatCard 
                title="Péremptions" 
                value={String(stats.expiring)} 
                icon={CalendarClock} 
                colorClass="bg-purple-500/10 text-purple-500" 
                subtitle="Moins de 30 jours" 
            />
        </div>
    );
};
