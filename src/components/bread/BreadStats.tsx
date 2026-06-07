'use client';
import { useMemo } from 'react';
import type { BreadOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, Wallet } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';

interface BreadStatsProps {
    date: string;
    isLoading?: boolean;
}

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle, progress }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string, progress?: number }) => (
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
            {progress !== undefined && (
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-[8px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                        <span>Progression</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1 bg-white/5 [&>div]:bg-primary shadow-sm" />
                </div>
            )}
        </CardContent>
    </Card>
);

export function BreadStats({ date, isLoading: externalLoading }: BreadStatsProps) {
    // Live query for specific date bread orders to update stats instantly
    const ordersResult = useLiveQuery<BreadOrder[]>(() => db.bread_orders.where('date').equals(date).toArray(), [date]);
    const orders = ordersResult.value ?? [];

    const stats = useMemo(() => {
        if (!orders) return { totalQuantity: 0, deliveredQuantity: 0, paidQuantity: 0, unpaidQuantity: 0, totalOrders: 0 };
        return {
            totalOrders: orders.length,
            totalQuantity: orders.reduce((sum, o) => sum + o.quantite, 0),
            deliveredQuantity: orders.filter(o => o.est_livre).reduce((sum, o) => sum + o.quantite, 0),
            paidQuantity: orders.filter(o => !!o.venteUuid).reduce((sum, o) => sum + o.quantite, 0),
            unpaidQuantity: orders.filter(o => !o.venteUuid).reduce((sum, o) => sum + o.quantite, 0),
        };
    }, [orders]);

    const deliveryPercentage = stats.totalQuantity > 0 
        ? Math.round((stats.deliveredQuantity / stats.totalQuantity) * 100) 
        : 0;

    if (ordersResult.value === undefined || externalLoading) {
        return (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg bg-card/40" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <StatCard 
                title="Volume de Production" 
                value={String(stats.totalQuantity)} 
                icon={Package} 
                colorClass="bg-primary/10 text-primary" 
                subtitle={`Répartis sur ${stats.totalOrders} bons`} 
            />
            <StatCard 
                title="Taux de Livraison" 
                value={String(stats.deliveredQuantity)} 
                icon={Truck} 
                colorClass="bg-emerald-500/10 text-emerald-500" 
                subtitle="Unités expédiées" 
                progress={deliveryPercentage}
            />
            <StatCard 
                title="Encaissement Pain" 
                value={String(stats.paidQuantity)} 
                icon={Wallet} 
                colorClass="bg-amber-500/10 text-amber-500" 
                subtitle={`${stats.unpaidQuantity} unités en attente`} 
            />
        </div>
    );
}
