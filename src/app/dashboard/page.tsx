'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { dashboardService } from '@/services/dashboard.service';
import {
    TrendingUp, Receipt, Users, Archive, ShoppingCart, 
    LayoutDashboard, Percent, Wallet, Wheat
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardWidgets } from '@/components/dashboard/DashboardWidgets';
import { TopLists } from '@/components/dashboard/TopLists';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { useAppStore } from '@/stores/appStore';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * لوحة القيادة Elite - iPOS Zen.
 * تم تنظيفها من الزوائد والمكررات للتركيز على الأداء والوضوح المالي.
 */
export default function DashboardPage() {
    const [mounted, setMounted] = useState(false);
    const { dateRange, setDate, isMounted: dateRangeMounted } = useDateRange(29);
    const companyProfile = useAppStore(state => state.companyProfile);

    useEffect(() => {
        setMounted(true);
    }, []);
    
    const dataResult = useLiveQuery(
        async () => {
            if (!mounted || !dateRange?.from || !dateRange?.to) return null;
            return await dashboardService.getDashboardData(dateRange.from, dateRange.to);
        },
        [mounted, dateRange],
    );
    const data = dataResult.value;
    const isLoading = dataResult.isLoading || !mounted || !dateRangeMounted;

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

    if (!mounted) {
        return (
            <div className="p-6 space-y-8 max-w-[1800px] mx-auto animate-pulse">
                <Skeleton className="h-10 w-64 rounded-xl" />
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 h-96"><Skeleton className="w-full h-full rounded-2xl" /></div>
                    <div className="lg:col-span-4 h-96"><Skeleton className="w-full h-full rounded-2xl" /></div>
                </div>
            </div>
        );
    }

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
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <DashboardWidgets 
                        type="bread" 
                        data={data?.breadSummary} 
                        isLoading={isLoading} 
                        breadPrice={companyProfile?.breadPrice || 10}
                    />
                    <DashboardWidgets type="alerts" data={data?.alerts} isLoading={isLoading} />
                    <ActivityFeed items={data?.recentActivity ?? []} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}
