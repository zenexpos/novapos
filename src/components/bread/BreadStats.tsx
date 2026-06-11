'use client';
import { useMemo } from 'react';
import type { BreadOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, Wallet, Landmark, AlertCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { Skeleton } from '../ui/skeleton';

interface BreadStatsProps {
    date: string;
}

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string }) => (
    <Card className="app-card bg-card/40 backdrop-blur-sm border-white/5 rounded-lg group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-primary transition-all duration-500 tracking-widest">{title}</CardTitle>
            <div className={cn("p-2.5 rounded-xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-4 w-4" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
            <div className="text-xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left tabular-nums">{value}</div>
            {subtitle && <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/30 mt-1">{subtitle}</p>}
        </CardContent>
    </Card>
);

export function BreadStats({ date }: BreadStatsProps) {
    const ordersResult = useLiveQuery<BreadOrder[]>(() => {
        if (!date) return [];
        return db.bread_orders.where('date').equals(date).filter(o => !o.deletedAt).toArray();
    }, [date]);

    const stats = useMemo(() => {
        if (!ordersResult.value) return { 
            count: 0, totalVal: 0, paidVal: 0, unpaidVal: 0, 
            unreceived: 0, transferred: 0, debts: 0 
        };
        const orders = ordersResult.value;

        return {
            count: orders.length,
            totalVal: orders.reduce((s, o) => s + o.totalAmount, 0),
            paidVal: orders.reduce((s, o) => s + o.amountPaid, 0),
            unpaidVal: orders.reduce((s, o) => s + o.remainingAmount, 0),
            unreceived: orders.filter(o => o.pickupStatus === 'unreceived').length,
            transferred: orders.filter(o => o.transferredToCustomerAccount).length,
            debts: orders.filter(o => o.transferredToCustomerAccount).reduce((s, o) => s + o.remainingAmount, 0)
        };
    }, [ordersResult.value]);

    if (ordersResult.isLoading) {
        return <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl bg-card/40" />)}
        </div>;
    }

    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7 animate-in fade-in duration-500">
            <StatCard title="Total Commandes" value={String(stats.count)} icon={Package} colorClass="bg-primary/10 text-primary" />
            <StatCard title="Valeur Ventes" value={formatCurrency(stats.totalVal)} icon={Landmark} colorClass="bg-emerald-500/10 text-emerald-500" />
            <StatCard title="Total Encaissé" value={formatCurrency(stats.paidVal)} icon={Wallet} colorClass="bg-emerald-500/10 text-emerald-500" />
            <StatCard title="Restant Dû" value={formatCurrency(stats.unpaidVal)} icon={AlertCircle} colorClass="bg-destructive/10 text-destructive" />
            <StatCard title="Non Livré" value={String(stats.unreceived)} icon={Truck} colorClass="bg-amber-500/10 text-amber-500" />
            <StatCard title="Transféré" value={String(stats.transferred)} icon={Landmark} colorClass="bg-blue-500/10 text-blue-500" />
            <StatCard title="Dettes Commandes" value={formatCurrency(stats.debts)} icon={Wallet} colorClass="bg-purple-500/10 text-purple-500" />
        </div>
    );
}
