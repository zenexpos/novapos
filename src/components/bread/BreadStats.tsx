'use client';

import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Truck, Landmark, Wallet, Layers } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import type { BreadOrder } from '@/lib/types';

interface BreadStatsProps {
    date: string;
}

const StatCard = memo(({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string }) => (
    <Card className="app-card bg-card/40 backdrop-blur-sm border-white/5 rounded-2xl group overflow-hidden transition-all hover:border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-5">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground/60 group-hover:text-primary transition-colors tracking-widest">{title}</CardTitle>
            <div className={cn("p-2.5 rounded-xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-4 w-4" />
            </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
            <div className="text-2xl font-black tracking-tighter text-foreground tabular-nums leading-none">{value}</div>
            {subtitle && <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/30 mt-1.5">{subtitle}</p>}
        </CardContent>
    </Card>
));
StatCard.displayName = 'StatCard';

export const BreadStats = memo(({ date }: BreadStatsProps) => {
    const { value: orders, isLoading } = useLiveQuery<BreadOrder[]>(
        () => date ? db.bread_orders.where('date').equals(date).filter(o => !o.deletedAt).toArray() : Promise.resolve([]),
        [date]
    );

    const stats = useMemo(() => {
        if (!orders) return { 
            count: 0, totalPieces: 0, totalVal: 0, paidVal: 0, unpaidVal: 0, 
            unreceivedPieces: 0, paidCount: 0, unpaidCount: 0
        };

        return {
            count: orders.length,
            totalPieces: orders.reduce((s, o) => s + (o.quantity || 0), 0),
            totalVal: orders.reduce((s, o) => s + o.totalAmount, 0),
            paidVal: orders.reduce((s, o) => s + (o.isPaid ? o.totalAmount : o.amountPaid), 0),
            unpaidVal: orders.reduce((s, o) => s + (o.isPaid ? 0 : o.remainingAmount), 0),
            unreceivedPieces: orders.filter(o => !o.isDelivered).reduce((s, o) => s + (o.quantity || 0), 0),
            paidCount: orders.filter(o => o.isPaid).length,
            unpaidCount: orders.filter(o => !o.isPaid).length
        };
    }, [orders]);

    if (isLoading) {
        return (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="h-28 rounded-2xl border border-white/5 animate-pulse bg-card/40" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 animate-in fade-in duration-700">
            <StatCard 
                title="Volume Distribution" 
                value={`${stats.totalPieces} PCS`} 
                icon={Layers} 
                colorClass="bg-primary/10 text-primary" 
                subtitle={`${stats.count} commandes actives`}
            />
            <StatCard 
                title="Liquidités Perçues" 
                value={formatCurrency(stats.paidVal)} 
                icon={CheckCircle2} 
                colorClass="bg-emerald-500/10 text-emerald-500" 
                subtitle={`${stats.paidCount} soldées cash`}
            />
            <StatCard 
                title="Reste à Recouvrer" 
                value={formatCurrency(stats.unpaidVal)} 
                icon={Wallet} 
                colorClass="bg-red-500/10 text-red-500" 
                subtitle={`${stats.unpaidCount} dettes générées`}
            />
            <StatCard 
                title="Logistique Reste" 
                value={`${stats.unreceivedPieces} PCS`} 
                icon={Truck} 
                colorClass="bg-amber-500/10 text-amber-500" 
                subtitle="En attente de retrait"
            />
            <StatCard 
                title="Valeur Prévisionnelle" 
                value={formatCurrency(stats.totalVal)} 
                icon={Landmark} 
                colorClass="bg-blue-500/10 text-blue-500" 
                subtitle="Chiffre d'affaires estimé"
            />
        </div>
    );
});
BreadStats.displayName = 'BreadStats';
