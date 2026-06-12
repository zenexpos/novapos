'use client';

import React, { useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { dashboardService } from '@/services/dashboard.service';
import { inventoryService } from '@/services/inventory.service';
import {
    TrendingUp, Receipt, Users, Archive, ShoppingCart, 
    LayoutDashboard, Package, TriangleAlert, Percent, Wallet
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { DashboardData, LowStockProduct } from '@/lib/types';

export default function DashboardPage() {
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const dataResult = useLiveQuery<DashboardData | null>(
        async () => {
            if (!isMounted || !dateRange?.from || !dateRange?.to) return null;
            return await dashboardService.getDashboardData(dateRange.from, dateRange.to);
        },
        [isMounted, dateRange],
    );
    const dashboardData = dataResult.value;

    const isLoading = dataResult.isLoading || !isMounted;

    const statCards = useMemo(() => [
        { title: 'Recettes', value: formatCurrency(dashboardData?.stats.totalRevenue ?? 0), icon: TrendingUp, change: dashboardData?.stats.totalRevenueChange, color: 'primary' as const },
        { title: 'Bénéfice', value: formatCurrency(dashboardData?.stats.netProfit ?? 0), icon: Percent, change: dashboardData?.stats.netProfitChange, color: 'emerald' as const },
        { title: 'Dépenses', value: formatCurrency(dashboardData?.stats.totalExpenses ?? 0), icon: Wallet, change: dashboardData?.stats.totalExpensesChange, positiveIsGood: false, color: 'red' as const },
        { title: 'Ventes', value: String(dashboardData?.stats.saleCount ?? 0), icon: ShoppingCart, change: dashboardData?.stats.saleCountChange, color: 'blue' as const },
        { title: 'Dettes Clients', value: formatCurrency(dashboardData?.stats.totalOutstandingDebt ?? 0), icon: Users, color: 'violet' as const },
        { title: 'Panier Moyen', value: formatCurrency(dashboardData?.stats.averageBasket ?? 0), icon: Receipt, color: 'primary' as const },
        { title: 'Valeur Stock', value: formatCurrency(dashboardData?.stats.totalInventoryValue ?? 0), icon: Archive, color: 'emerald' as const },
        { title: 'Marge %', value: `${(dashboardData?.stats.profitMargin ?? 0).toFixed(1)}%`, icon: TrendingUp, color: 'blue' as const },
    ], [dashboardData]);

    if (!isMounted) return null;

    return (
        <div className="p-6 space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader
                title="Résumé de l'activité"
                description="Suivez vos performances en un coup d'œil"
                icon={LayoutDashboard}
            >
                <DateRangePicker date={dateRange} setDate={setDate} />
            </PageHeader>

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
                {statCards.map(card => (
                    <StatCard key={card.title} {...card} isLoading={isLoading} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Section Stock Bas */}
                <Card className="rounded-2xl border-white/5 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                    <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 p-4">
                        <div className="flex items-center gap-3">
                            <TriangleAlert className="h-5 w-5 text-amber-600" />
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-amber-700">Stock à surveiller</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        {isLoading ? <Skeleton className="h-40 w-full rounded-xl" /> : (
                            <div className="space-y-2">
                                {!dashboardData?.lowStockProducts || dashboardData.lowStockProducts.length === 0 ? (
                                    <p className="text-center text-xs text-muted-foreground py-8">Tout est en stock</p>
                                ) : dashboardData.lowStockProducts.map((p: LowStockProduct) => (
                                    <Link key={p.uuid} href="/products" className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20">
                                        <span className="text-sm font-bold truncate max-w-[150px]">{p.name}</span>
                                        <span className="text-xs font-black text-amber-600 bg-amber-500/10 px-2 py-1 rounded-lg">{p.quantity} {p.unit}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Section Top Ventes */}
                <Card className="rounded-2xl border-white/5 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden lg:col-span-2">
                    <CardHeader className="bg-primary/5 border-b border-primary/10 p-4">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary/70">Top 5 Produits</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        {isLoading ? <Skeleton className="h-40 w-full rounded-xl" /> : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {dashboardData?.topProducts.map((p, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-black/20 border border-white/5 text-center space-y-2 group hover:bg-primary/5 transition-all">
                                        <span className="text-[10px] font-black text-primary/40 uppercase"># {i + 1}</span>
                                        <p className="text-xs font-bold truncate">{p.name}</p>
                                        <p className="text-lg font-black text-primary tabular-nums">{p.quantitySold}<span className="text-[10px] ml-1 opacity-40">u</span></p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
