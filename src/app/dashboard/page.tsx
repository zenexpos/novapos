'use client';

import React, { useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { dashboardService } from '@/services/dashboard.service';
import {
    TrendingUp, Receipt, Users, Archive, ShoppingCart, 
    LayoutDashboard, Percent, Wallet, Wheat, PlusCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardWidgets } from '@/components/dashboard/DashboardWidgets';
import { TopLists } from '@/components/dashboard/TopLists';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { useAppStore } from '@/stores/appStore';
import Link from 'next/link';

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

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
                {statCards.map(card => (
                    <StatCard key={card.title} {...card} isLoading={isLoading} />
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <DashboardCharts data={data?.salesByDay ?? []} isLoading={isLoading} />
                    <div className="grid sm:grid-cols-2 gap-8">
                        <TopLists type="products" items={data?.topProducts ?? []} isLoading={isLoading} />
                        <TopLists type="customers" items={data?.topCustomers ?? []} isLoading={isLoading} />
                    </div>
                    <ActivityFeed items={data?.recentActivity ?? []} isLoading={isLoading} />
                </div>

                <div className="lg:col-span-4 space-y-8">
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
                            <QuickActionLink href="/stock" label="Stock" icon={Archive} />
                        </CardContent>
                    </Card>

                    <DashboardWidgets 
                        type="bread" 
                        data={data?.breadSummary} 
                        isLoading={isLoading} 
                        breadPrice={companyProfile?.breadPrice || 10}
                    />
                    <DashboardWidgets type="alerts" data={data?.alerts} isLoading={isLoading} />
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