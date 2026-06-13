'use client';

import React, { useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { dashboardService } from '@/services/dashboard.service';
import {
    TrendingUp, Receipt, Users, Archive, ShoppingCart, 
    LayoutDashboard, Package, TriangleAlert, Percent, Wallet,
    Wheat, BellRing, Activity, ArrowUpRight, Plus,
    ArrowDownRight,
    CircleCheckBig,
    Clock,
    UserPlus,
    PlusCircle
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardWidgets } from '@/components/dashboard/DashboardWidgets';
import { TopLists } from '@/components/dashboard/TopLists';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

/**
 * Tableau de Bord Elite iPOS Zen.
 * Centre de commandement centralisé pour le pilotage commercial et logistique.
 */
export default function DashboardPage() {
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    // Récupération réactive des données analytiques
    const dataResult = useLiveQuery(
        async () => {
            if (!isMounted || !dateRange?.from || !dateRange?.to) return null;
            return await dashboardService.getDashboardData(dateRange.from, dateRange.to);
        },
        [isMounted, dateRange],
    );
    const data = dataResult.value;
    const isLoading = dataResult.isLoading || !isMounted;

    // Configuration des cartes KPI avec calcul des tendances
    const statCards = useMemo(() => [
        { title: 'Recettes', value: formatCurrency(data?.stats.totalRevenue ?? 0), icon: TrendingUp, change: data?.stats.totalRevenueChange, color: 'primary' as const },
        { title: 'Bénéfice Net', value: formatCurrency(data?.stats.netProfit ?? 0), icon: Percent, change: data?.stats.netProfitChange, color: 'emerald' as const },
        { title: 'Dépenses', value: formatCurrency(data?.stats.totalExpenses ?? 0), icon: Wallet, change: data?.stats.totalExpensesChange, positiveIsGood: false, color: 'red' as const },
        { title: 'Ventes', value: String(data?.stats.saleCount ?? 0), icon: ShoppingCart, change: data?.stats.saleCountChange, color: 'blue' as const },
        { title: 'Dettes Clients', value: formatCurrency(data?.stats.totalOutstandingDebt ?? 0), icon: Users, color: 'violet' as const },
        { title: 'Panier Moyen', value: formatCurrency(data?.stats.averageBasket ?? 0), icon: Receipt, color: 'primary' as const },
        { title: 'Valeur Stock', value: formatCurrency(data?.stats.totalInventoryValue ?? 0), icon: Archive, color: 'emerald' as const },
        { title: 'Marge %', value: `${(data?.stats.profitMargin ?? 0).toFixed(1)}%`, icon: TrendingUp, color: 'blue' as const },
    ], [data]);

    if (!isMounted) return null;

    return (
        <div className="p-6 space-y-8 max-w-[1800px] mx-auto animate-in fade-in duration-1000 pb-20">
            <PageHeader
                title="Command Center Elite"
                description="Vision panoramique de la souveraineté commerciale"
                icon={LayoutDashboard}
            >
                <div className="flex gap-4 items-center">
                    <DateRangePicker date={dateRange} setDate={setDate} />
                </div>
            </PageHeader>

            {/* Grille des KPIs Stratégiques */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
                {statCards.map(card => (
                    <StatCard key={card.title} {...card} isLoading={isLoading} />
                ))}
            </div>

            {/* Layout Principal de Pilotage */}
            <div className="grid lg:grid-cols-12 gap-8">
                
                {/* Colonne Gauche - Analyse Graphique & Performance */}
                <div className="lg:col-span-8 space-y-8">
                    <DashboardCharts data={data?.salesByDay ?? []} isLoading={isLoading} />
                    
                    <div className="grid sm:grid-cols-2 gap-8">
                        <TopLists type="products" items={data?.topProducts ?? []} isLoading={isLoading} />
                        <TopLists type="customers" items={data?.topCustomers ?? []} isLoading={isLoading} />
                    </div>

                    <ActivityFeed items={data?.recentActivity ?? []} isLoading={isLoading} />
                </div>

                {/* Colonne Droite - Vigilance & Actions Rapides */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Panneau d'Actions Instantanées */}
                    <Card className="rounded-2xl border-white/5 bg-primary/5 shadow-xl overflow-hidden group">
                        <CardHeader className="bg-primary/10 border-b border-primary/20 p-4">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" /> Actions Prioritaires
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-2 gap-3">
                            <QuickActionLink href="/sell" label="Vendre" icon={ShoppingCart} />
                            <QuickActionLink href="/customers" label="+ Client" icon={UserPlus} />
                            <QuickActionLink href="/bread" label="Pain" icon={Wheat} />
                            <QuickActionLink href="/products" label="+ Produit" icon={Plus} />
                            <QuickActionLink href="/stock/intake" label="Achat" icon={Archive} />
                            <QuickActionLink href="/expenses" label="Dépense" icon={Wallet} />
                        </CardContent>
                    </Card>

                    {/* Widgets de Surveillance Spécifiques */}
                    <DashboardWidgets type="bread" data={data?.breadSummary} isLoading={isLoading} />
                    <DashboardWidgets type="alerts" data={data?.alerts} isLoading={isLoading} />
                    
                    {/* Indicateur de Santé du Stock */}
                    <Card className="rounded-2xl border-white/5 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
                            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-40">Statut du Catalogue</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <HealthMetric 
                                label="Ruptures de stock" 
                                value={data?.inventoryHealth.outOfStock ?? 0} 
                                color="text-red-500" 
                                total={data?.inventoryHealth.outOfStock ?? 0 + (data?.inventoryHealth.healthy ?? 0)} 
                            />
                            <HealthMetric 
                                label="Articles sous seuil" 
                                value={data?.inventoryHealth.lowStock ?? 0} 
                                color="text-amber-500" 
                                total={data?.inventoryHealth.healthy ?? 0} 
                            />
                            <HealthMetric 
                                label="Articles opérationnels" 
                                value={data?.inventoryHealth.healthy ?? 0} 
                                color="text-emerald-500" 
                                total={data?.inventoryHealth.healthy ?? 0} 
                            />
                        </CardContent>
                        <div className="p-4 bg-muted/10 border-t border-white/5 text-center">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/30">
                                Valorisation Stock : {formatCurrency(data?.inventoryHealth.totalValue ?? 0)}
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function QuickActionLink({ href, label, icon: Icon }: { href: string, label: string, icon: any }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all group shadow-sm">
            <Icon className="h-6 w-6 text-primary/40 group-hover:text-primary transition-colors mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary">{label}</span>
        </Link>
    );
}

function HealthMetric({ label, value, color, total }: { label: string, value: number, color: string, total: number }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase text-muted-foreground/40">{label}</span>
                <span className={cn("text-lg font-black tabular-nums", color)}>{value}</span>
            </div>
            <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-1000", color.replace('text', 'bg'))} style={{ width: `${Math.min(100, (value / (total || 1)) * 100)}%` }} />
            </div>
        </div>
    );
}
