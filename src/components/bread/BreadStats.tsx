'use client';

import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, PackageCheck, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        if (!orders || orders.length === 0) return { 
            requested: 0, delivered: 0, remaining: 0, paid: 0, count: 0
        };

        return {
            count: orders.length,
            requested: orders.reduce((s, o) => s + (o.quantity || 0), 0),
            delivered: orders.filter(o => o.isDelivered).reduce((s, o) => s + (o.quantity || 0), 0),
            remaining: orders.filter(o => !o.isDelivered).reduce((s, o) => s + (o.quantity || 0), 0),
            paid:      orders.filter(o => o.isPaid).reduce((s, o) => s + (o.quantity || 0), 0),
        };
    }, [orders]);

    if (isLoading) {
        return (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="h-28 rounded-2xl border border-white/5 animate-pulse bg-card/40" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-700">
            <StatCard 
                title="Quantité Demandée" 
                value={`${stats.requested} PCS`} 
                icon={Layers} 
                colorClass="bg-primary/10 text-primary" 
                subtitle={`${stats.count} flux enregistrés`}
            />
            <StatCard 
                title="Quantité Livrée" 
                value={`${stats.delivered} PCS`} 
                icon={PackageCheck} 
                colorClass="bg-emerald-500/10 text-emerald-500" 
                subtitle="Distribution effectuée"
            />
            <StatCard 
                title="Quantité Restante" 
                value={`${stats.remaining} PCS`} 
                icon={Clock} 
                colorClass="bg-amber-500/10 text-amber-500" 
                subtitle="En attente de retrait"
            />
            <StatCard 
                title="Quantité Payée" 
                value={`${stats.paid} PCS`} 
                icon={CheckCircle2} 
                colorClass="bg-blue-500/10 text-blue-500" 
                subtitle="Règlements cash validés"
            />
        </div>
    );
});
BreadStats.displayName = 'BreadStats';