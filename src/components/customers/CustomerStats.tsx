'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Landmark, TriangleAlert } from 'lucide-react';
import { formatCurrency, cn, safeNumber } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import type { Customer } from '@/lib/types';

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: any, colorClass: string }) => (
    <Card className="h-full bg-card/40 border-none shadow-sm rounded-xl overflow-hidden group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-4">
            <CardTitle className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">{title}</CardTitle>
            <div className={cn("p-1.5 rounded-lg shadow-inner", colorClass)}>
                <Icon className="h-3.5 w-3.5" />
            </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
            <div className="text-xl font-black tracking-tighter tabular-nums">{value}</div>
        </CardContent>
    </Card>
);

export function CustomerStats() {
  const customersResult = useLiveQuery<Customer[]>(() => db.customers.toArray());
  const customers = customersResult.value;

  const stats = useMemo(() => {
    if (!customers) return { total: 0, overdue: 0, totalOutstanding: 0 };
    let totalDebtCents = 0;
    let overdueCount = 0;

    customers.forEach(c => {
        const balance = safeNumber(c.outstandingBalance);
        if (balance > 0.009) {
            totalDebtCents += Math.round(balance * 100);
            if (c.debtStatus === 'overdue') overdueCount++;
        }
    });

    return {
        total: customers.filter(c => !c.deletedAt).length,
        overdue: overdueCount,
        totalOutstanding: totalDebtCents / 100
    };
  }, [customers]);

  if (customers === undefined) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-500">
      <StatCard 
        title="Fichier Clients" 
        value={String(stats.total)} 
        icon={Users} 
        colorClass="bg-primary/10 text-primary" 
      />
      <StatCard 
        title="Dette Globale" 
        value={formatCurrency(stats.totalOutstanding)} 
        icon={Landmark} 
        colorClass="bg-red-500/10 text-red-500" 
      />
      <StatCard 
        title="Retards" 
        value={String(stats.overdue)} 
        icon={TriangleAlert} 
        colorClass="bg-amber-500/10 text-amber-500" 
      />
    </div>
  );
}
