'use client';

import React, { useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { dashboardService } from '@/services/dashboard.service';
import {
    TrendingUp, Receipt, Users, Archive, ShoppingCart, 
    LayoutDashboard, Percent, Wallet,
    Wheat, Plus, PlusCircle,
    BarChart3, PieChart
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
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip } from 'recharts';
import { useAppStore } from '@/stores/appStore';

/**
 * Command Center Elite - iPOS Zen.
 * Vision stratégique complète de l'activité commerciale.
 */
export default function DashboardPage() {
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const companyProfile = useAppStore(state => state.companyProfile);
    
    const dataResult = useLiveQuery(
        async () => {
            if (!isMounted || !dateRange?.from || !dateRange?.to) return null;
            return await dashboardService.getDashboardData(dateRange.from, dateRange.to);
        },
        [isMounted, dateRange],
    );
    const data = dataResult.value;
    const isLoading = dataResult.isLoading || !isMounted;

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
                description="Pilotage souverain de votre écosystème commercial"
                icon={LayoutDashboard}
            >
                <div className="flex gap-4 items-center">
                    <DateRangePicker date={dateRange} setDate={setDate} />
                </div>
            </PageHeader>

            {/* KPI STRATÉGIQUES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
                {statCards.map(card => (
                    <StatCard key={card.title} {...card} isLoading={isLoading} />
                ))}
            </div>

            {/* LAYOUT PRINCIPAL */}
            <div className="grid lg:grid-cols-12 gap-8">
                
                {/* COLONNE GAUCHE - ANALYSE & PERFORMANCE */}
                <div className="lg:col-span-8 space-y-8">
                    <DashboardCharts data={data?.salesByDay ?? []} isLoading={isLoading} />
                    
                    <div className="grid sm:grid-cols-2 gap-8">
                        <TopLists type="products" items={data?.topProducts ?? []} isLoading={isLoading} />
                        <TopLists type="customers" items={data?.topCustomers ?? []} isLoading={isLoading} />
                    </div>

                    <ActivityFeed items={data?.recentActivity ?? []} isLoading={isLoading} />
                </div>

                {/* COLONNE DROITE - VIGILANCE & ACTIONS */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* ACTIONS RAPIDES */}
                    <Card className="rounded-2xl border-white/5 bg-primary/5 shadow-xl overflow-hidden group">
                        <CardHeader className="bg-primary/10 border-b border-primary/20 p-4">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" /> Console d'Exécution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-2 gap-3">
                            <QuickActionLink href="/sell" label="Vendre" icon={ShoppingCart} />
                            <QuickActionLink href="/customers" label="+ Client" icon={Users} />
                            <QuickActionLink href="/bread" label="Pain" icon={Wheat} />
                            <QuickActionLink href="/products" label="+ Produit" icon={Plus} />
                            <QuickActionLink href="/stock" label="Achat" icon={Archive} />
                            <QuickActionLink href="/expenses" label="Dépense" icon={Wallet} />
                        </CardContent>
                    </Card>

                    {/* WIDGET PAIN & ALERTES */}
                    <DashboardWidgets 
                        type="bread" 
                        data={data?.breadSummary} 
                        isLoading={isLoading} 
                        breadPrice={companyProfile?.breadPrice || 10}
                    />
                    <DashboardWidgets type="alerts" data={data?.alerts} isLoading={isLoading} />
                    
                    {/* SANTÉ DU STOCK */}
                    <Card className="rounded-2xl border-white/5 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
                            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-40">État du Catalogue</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <HealthMetric label="Ruptures" value={data?.inventoryHealth.outOfStock ?? 0} color="text-red-500" total={data?.kpis.activeProducts ?? 1} />
                            <HealthMetric label="Stock Faible" value={data?.inventoryHealth.lowStock ?? 0} color="text-amber-500" total={data?.kpis.activeProducts ?? 1} />
                            <HealthMetric label="Opérationnels" value={data?.inventoryHealth.healthy ?? 0} color="text-emerald-500" total={data?.kpis.activeProducts ?? 1} />
                        </CardContent>
                        <div className="p-4 bg-muted/10 border-t border-white/5 text-center">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/30">
                                Valeur Immobilisée : {formatCurrency(data?.inventoryHealth.totalValue ?? 0)}
                            </p>
                        </div>
                    </Card>

                    {/* MONITORING DETTES */}
                    <Card className="rounded-2xl border-white/5 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/20 border-b border-white/5 p-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-40">Vieillissement Dettes</CardTitle>
                            <PieChart className="h-4 w-4 opacity-20" />
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={data?.debtAging ?? []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell fill="hsl(var(--chart-2))" />
                                            <Cell fill="hsl(var(--chart-3))" />
                                            <Cell fill="hsl(var(--chart-5))" />
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: 'none', fontSize: '10px' }}
                                            formatter={(v: number) => formatCurrency(v)}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 mt-4">
                                {data?.debtAging.map((age, i) => (
                                    <div key={i} className="flex justify-between items-center text-[10px] font-bold uppercase">
                                        <span className="text-muted-foreground/40">{age.label}</span>
                                        <span className="tabular-nums">{formatCurrency(age.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* INDICATEURS DE PERFORMANCE */}
                    <Card className="rounded-2xl border-white/5 bg-secondary text-secondary-foreground shadow-2xl overflow-hidden relative">
                        <BarChart3 className="absolute -right-4 -bottom-4 h-24 w-24 opacity-5 rotate-12" />
                        <CardHeader className="p-4 border-b border-white/5">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-40">Ratios Elite</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold opacity-40 uppercase">Rotation Stock</p>
                                <p className="text-xl font-black">{data?.kpis.stockRotation.toFixed(2)}x</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold opacity-40 uppercase">Taux Recouvrement</p>
                                <p className="text-xl font-black text-emerald-400">{data?.kpis.recoveryRate.toFixed(1)}%</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold opacity-40 uppercase">Clients Actifs</p>
                                <p className="text-xl font-black">{data?.kpis.activeCustomers}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold opacity-40 uppercase">Articles en Vente</p>
                                <p className="text-xl font-black">{data?.kpis.activeProducts}</p>
                            </div>
                        </CardContent>
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
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary text-center">{label}</span>
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