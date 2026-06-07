'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle, UserX, Landmark } from 'lucide-react';
import { formatCurrency, cn, safeNumber } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { Customer } from '@/lib/types';

/**
 * Composant de carte statistique unifié avec design Elite.
 */
const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string }) => (
    <Card className="app-card h-full bg-card/40 backdrop-blur-sm border-white/5 rounded-lg group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-primary transition-all duration-500 tracking-widest">{title}</CardTitle>
            <div className={cn("p-3 rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
            <div className="text-2xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left mb-1 tabular-nums">{value}</div>
            {subtitle && <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40">{subtitle}</p>}
        </CardContent>
    </Card>
);

/**
 * Composant CustomerStats - Calcule et affiche les indicateurs clés de la base client.
 * Utilise useLiveQuery pour assurer la réactivité.
 */
export function CustomerStats() {
  // Surveillance en direct du fichier clients
  const customersResult = useLiveQuery<Customer[]>(() => db.customers.toArray());
  const customers = customersResult.value;

  const stats = useMemo(() => {
    if (!customers) return { total: 0, overdue: 0, overLimit: 0, totalOutstanding: 0 };
    
    // Moteur de calcul en centimes pour une précision absolue
    let totalDebtCents = 0;
    let overdueCount = 0;
    let overLimitCount = 0;

    customers.forEach(c => {
        const balance = safeNumber(c.outstandingBalance);
        
        if (balance > 0.009) {
            totalDebtCents += Math.round(balance * 100);
            if (c.debtStatus === 'overdue') overdueCount++;
            if (c.isOverLimit) overLimitCount++;
        }
    });

    return {
        total: customers.length,
        overdue: overdueCount,
        overLimit: overLimitCount,
        totalOutstanding: totalDebtCents / 100
    };
  }, [customers]);

  if (customers === undefined) {
    return (
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl bg-card/40 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-700">
      <StatCard 
        title="Fichier Clients" 
        value={String(stats.total)} 
        icon={Users} 
        colorClass="bg-primary/10 text-primary" 
        subtitle="Partenaires enregistrés" 
      />
      <StatCard 
        title="Créances Totales" 
        value={formatCurrency(stats.totalOutstanding)} 
        icon={Landmark} 
        colorClass="bg-destructive/10 text-destructive shadow-destructive/5" 
        subtitle="Dettes clients actives" 
      />
      <StatCard 
        title="Retards de Paiement" 
        value={String(stats.overdue)} 
        icon={AlertTriangle} 
        colorClass="bg-amber-500/10 text-amber-500" 
        subtitle="Dossiers à risque de retard" 
      />
      <StatCard 
        title="Crédits Dépassés" 
        value={String(stats.overLimit)} 
        icon={UserX} 
        colorClass="bg-red-500/10 text-red-500" 
        subtitle="Dépassement du crédit" 
      />
    </div>
  );
}
