'use client';

import { useMemo } from 'react';
import type { BreadOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, CheckCircle2, XCircle, Truck, Landmark } from 'lucide-react';
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
            count: 0, totalPieces: 0, totalVal: 0, paidVal: 0, unpaidVal: 0, 
            unreceivedPieces: 0, paidCount: 0, unpaidCount: 0
        };
        const orders = ordersResult.value;

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
    }, [ordersResult.value]);

    if (ordersResult.isLoading) {
        return (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl bg-card/40" />)}
            </div>
        );
    }

    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 animate-in fade-in duration-500">
            <StatCard 
                title="Volume" 
                value={`${stats.totalPieces} PCS`} 
                icon={ShoppingBag} 
                colorClass="bg-primary/10 text-primary" 
                subtitle={`${stats.count} flux actifs`}
            />
            <StatCard 
                title="Payés" 
                value={String(stats.paidCount)} 
                icon={CheckCircle2} 
                colorClass="bg-emerald-500/10 text-emerald-500" 
                subtitle={formatCurrency(stats.paidVal)}
            />
            <StatCard 
                title="Crédits" 
                value={String(stats.unpaidCount)} 
                icon={XCircle} 
                colorClass="bg-orange-500/10 text-orange-500" 
                subtitle={formatCurrency(stats.unpaidVal)}
            />
            <StatCard 
                title="Attente" 
                value={`${stats.unreceivedPieces} PCS`} 
                icon={Truck} 
                colorClass="bg-amber-500/10 text-amber-500" 
                subtitle="À distribuer"
            />
            <StatCard 
                title="Valeur" 
                value={formatCurrency(stats.totalVal)} 
                icon={Landmark} 
                colorClass="bg-blue-500/10 text-blue-500" 
                subtitle="Chiffre estimé"
            />
        </div>
    );
}
