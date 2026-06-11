'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import type { DashboardData, RecentSale, RecentReturn, SalesByDay } from '@/lib/types';
import { dashboardService } from '@/services/dashboard.service';
import { inventoryService } from '@/services/inventory.service';
import {
    TrendingUp, Receipt, Undo2, Users, CreditCard, Archive,
    RefreshCw, ArrowUpRight, ArrowDownRight, ShoppingCart, Wallet,
    Percent, Sparkles, LayoutDashboard, Package, TriangleAlert,
} from 'lucide-react';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import {
    ResponsiveContainer, AreaChart, XAxis, YAxis,
    Tooltip, Area, CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveQuery } from '@/hooks/useLiveQuery';

/* ─── StatCard ──────────────────────────────────────────────────────────── */
const StatCard = React.memo(({
    title, value, icon: Icon, change, isLoading,
    href, positiveIsGood = true, suffix, color = 'primary',
}: {
    title: string; value: string; icon: React.ElementType;
    change?: number; isLoading: boolean; href?: string;
    positiveIsGood?: boolean; suffix?: string;
    color?: 'primary' | 'emerald' | 'red' | 'blue' | 'violet';
}) => {
    const isPositive = change !== undefined && change >= 0;
    const isGood     = positiveIsGood ? isPositive : !isPositive;

    const colorMap: Record<string, string> = {
        primary: 'from-primary/20 to-primary/5 border-primary/20 text-primary',
        emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-500',
        red:     'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
        blue:    'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
        violet:  'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400',
    };
    const iconColors = colorMap[color];

    const card = (
        <div className="glass-stat group h-full p-5 flex flex-col gap-4 cursor-default">
            <div className="flex items-start justify-between">
                <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-xl',
                    'bg-gradient-to-br border transition-all duration-300',
                    'group-hover:scale-110 group-hover:rotate-3',
                    iconColors,
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                {change !== undefined && isFinite(change) && (
                    <div className={cn(
                        'flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-black border',
                        isGood
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20',
                    )}>
                        {isPositive
                            ? <ArrowUpRight className="h-3 w-3" />
                            : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(change).toFixed(1)}%
                    </div>
                )}
            </div>

            <div>
                {isLoading ? (
                    <Skeleton className="h-8 w-28 rounded-lg mb-1" />
                ) : (
                    <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-black tracking-tight tabular-nums
                            group-hover:scale-105 origin-left transition-transform duration-300">
                            {value}
                        </p>
                        {suffix && <span className="text-xs text-muted-foreground font-medium">{suffix}</span>}
                    </div>
                )}
                <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mt-1">
                    {title}
                </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
    );

    if (href) return (
        <Link href={href} className="block transition-transform hover:-translate-y-0.5 active:scale-98">
            {card}
        </Link>
    );
    return card;
});
StatCard.displayName = 'StatCard';

/* ─── SalesChart ────────────────────────────────────────────────────────── */
const SalesChart = React.memo(({ data, isLoading }: { data: SalesByDay[]; isLoading: boolean }) => (
    <Card className="lg:col-span-2 overflow-hidden">
        <CardHeader className="px-5 pt-5 pb-4 border-b border-[var(--glass-border)] flex-row items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl
                bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20
                shadow-[0_0_12px_var(--glow-primary)]">
                <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
                <CardTitle className="text-base font-black tracking-tight gradient-text">
                    Évolution des ventes
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest font-semibold">
                    Ventes et Bénéfices · {data.length}j
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-72 p-4 pt-6">
            {isLoading ? (
                <div className="h-full flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 text-primary/30 animate-spin" />
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="hsl(var(--chart-primary))" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="hsl(var(--chart-tertiary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--chart-tertiary))" stopOpacity={0} />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.25)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={s => format(new Date(s), 'd MMM', { locale: fr })}
                            stroke="hsl(var(--muted-foreground) / 0.5)"
                            fontSize={9} fontWeight={700} tickLine={false} axisLine={false} dy={10}
                        />
                        <YAxis
                            tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                            stroke="hsl(var(--muted-foreground) / 0.5)"
                            fontSize={9} fontWeight={700} tickLine={false} axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background:    'var(--glass-bg)',
                                backdropFilter: 'blur(20px)',
                                border:        '1px solid var(--glass-border)',
                                borderRadius:  '12px',
                                boxShadow:     '0 16px 40px rgba(0,0,0,0.35)',
                            }}
                            itemStyle={{ fontSize: 11, fontWeight: 700 }}
                            formatter={(v: number, name: string) => [
                                formatCurrency(v),
                                name === 'total' ? 'Recettes' : 'Bénéfice',
                            ]}
                        />
                        <Area type="monotone" dataKey="total"  stroke="hsl(var(--chart-primary))"  strokeWidth={2.5} fill="url(#gRevenue)" />
                        <Area type="monotone" dataKey="profit" stroke="hsl(var(--chart-tertiary))" strokeWidth={2}   fill="url(#gProfit)"  strokeDasharray="8 4" />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </CardContent>
    </Card>
));
SalesChart.displayName = 'SalesChart';

/* ─── RecentActivity ────────────────────────────────────────────────────── */
const RecentActivity = React.memo(({ sales, returns, isLoading }: {
    sales: RecentSale[]; returns: RecentReturn[]; isLoading: boolean;
}) => (
    <Card className="overflow-hidden">
        <CardHeader className="px-5 pt-5 pb-4 border-b border-[var(--glass-border)]">
            <CardTitle className="text-base font-black tracking-tight gradient-text">
                Ventes récentes
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-widest font-semibold">
                Activité d'aujourd'hui
            </CardDescription>
        </CardHeader>
        <CardContent className="p-3 max-h-80 overflow-y-auto space-y-1.5">
            {isLoading ? (
                <div className="space-y-2 p-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton className="h-14 w-full rounded-xl" />
                    ))}
                </div>
            ) : sales.length === 0 && returns.length === 0 ? (
                <div className="py-14 flex flex-col items-center gap-3 opacity-25">
                    <Sparkles className="h-10 w-10" />
                    <p className="text-xs font-bold uppercase tracking-widest">Aucune vente</p>
                </div>
            ) : (
                <>
                    {sales.map((s, i) => (
                        <Link
                            key={s.uuid}
                            href={`/sales-history?query=${s.invoiceNumber}`}
                            style={{ animationDelay: `${i * 40}ms` }}
                            className="flex items-center gap-3 p-3 rounded-xl
                                border border-transparent
                                hover:bg-primary/6 hover:border-primary/20
                                transition-all duration-200 group animate-slide-up"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg
                                bg-primary/10 text-primary border border-primary/15
                                group-hover:scale-110 transition-transform duration-200 shrink-0">
                                <Receipt className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                    {s.customerName}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 font-mono">
                                    {format(safeToDate(s.createdAt!), 'HH:mm')} · #{s.invoiceNumber}
                                </p>
                            </div>
                            <p className="text-sm font-black text-primary tabular-nums">
                                {formatCurrency(s.total)}
                            </p>
                        </Link>
                    ))}
                    {returns.map((r, i) => (
                        <Link
                            key={r.uuid}
                            href={`/returns?query=${r.originalInvoiceNumber}`}
                            style={{ animationDelay: `${(sales.length + i) * 40}ms` }}
                            className="flex items-center gap-3 p-3 rounded-xl
                                border border-transparent
                                hover:bg-red-500/6 hover:bg-red-500/20
                                transition-all duration-200 group animate-slide-up"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg
                                bg-red-500/10 text-red-400 border border-red-500/15
                                group-hover:scale-110 transition-transform duration-200 shrink-0">
                                <Undo2 className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{r.customerName}</p>
                                <p className="text-[10px] text-muted-foreground/60 font-mono">
                                    {format(safeToDate(r.createdAt!), 'HH:mm')} · Retour
                                </p>
                            </div>
                            <p className="text-sm font-black text-red-400 tabular-nums">
                                -{formatCurrency(r.totalReturnValue)}
                            </p>
                        </Link>
                    ))}
                </>
            )}
        </CardContent>
    </Card>
));
RecentActivity.displayName = 'RecentActivity';

/* ─── LowStockPanel ─────────────────────────────────────────────────────── */
const LowStockPanel = React.memo(({ products, isLoading }: { products: any[]; isLoading: boolean }) => (
    <Card className="overflow-hidden">
        <CardHeader className="px-5 pt-5 pb-4 border-b border-[var(--glass-border)]">
            <div className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base font-black tracking-tight">
                    Stock bas
                </CardTitle>
            </div>
        </CardHeader>
        <CardContent className="p-3 max-h-64 overflow-y-auto space-y-1">
            {isLoading ? (
                <div className="space-y-2 p-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                </div>
            ) : products.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 opacity-25">
                    <Package className="h-8 w-8" />
                    <p className="text-xs font-bold uppercase tracking-widest">Stock suffisant</p>
                </div>
            ) : products.map((p, i) => (
                <Link
                    key={p.uuid}
                    href="/products"
                    style={{ animationDelay: `${i * 30}ms` }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                        border border-transparent hover:border-amber-500/20 hover:bg-amber-500/5
                        transition-all duration-200 group animate-slide-up"
                >
                    <div className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        p.quantity <= 0 ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                                        : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
                    )} />
                    <p className="text-sm font-medium flex-1 truncate group-hover:text-amber-500 transition-colors">
                        {p.name}
                    </p>
                    <span className="text-xs font-black tabular-nums text-muted-foreground">
                        {p.quantity} {p.unite ?? 'u'}
                    </span>
                </Link>
            ))}
        </CardContent>
    </Card>
));
LowStockPanel.displayName = 'LowStockPanel';

/* ─── ProfitRing ─────────────────────────────────────────────────────────── */
const ProfitRing = React.memo(({
    margin, isLoading,
}: { margin: number; isLoading: boolean }) => {
    const clamped = Math.min(100, Math.max(0, margin));
    const r = 36, stroke = 7;
    const circ = 2 * PI * r;
    const dash  = (clamped / 100) * circ;
    const color = clamped >= 20 ? 'hsl(142 65% 42%)' : clamped >= 10 ? 'hsl(38 90% 50%)' : 'hsl(0 80% 55%)';
    const PI = 3.14159;

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-5 flex flex-col items-center justify-center gap-3 min-h-[140px]">
                {isLoading ? (
                    <Skeleton className="w-24 h-24 rounded-full" />
                ) : (
                    <div className="relative w-24 h-24">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                            <circle cx="44" cy="44" r={r} fill="none"
                                stroke="hsl(var(--muted))" strokeWidth={stroke} />
                            <circle cx="44" cy="44" r={r} fill="none"
                                stroke={color} strokeWidth={stroke}
                                strokeDasharray={`${(clamped/100)*2*Math.PI*r} ${2*Math.PI*r}`}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black tabular-nums" style={{ color }}>
                                {clamped.toFixed(1)}%
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                Marge
                            </span>
                        </div>
                    </div>
                )}
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 text-center">
                    Rentabilité moyenne
                </p>
            </CardContent>
        </Card>
    );
});
ProfitRing.displayName = 'ProfitRing';

/* ─── StockBar ───────────────────────────────────────────────────────────── */
const StockBar = React.memo(({
    total, outOfStock, lowStock, isLoading,
}: { total: number; outOfStock: number; lowStock: number; isLoading: boolean }) => {
    const ok = total - outOfStock - lowStock;
    const pOk  = total > 0 ? (ok / total) * 100 : 0;
    const pLow = total > 0 ? (lowStock / total) * 100 : 0;
    const pOut = total > 0 ? (outOfStock / total) * 100 : 0;

    return (
        <Card className="overflow-hidden lg:col-span-2">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-[var(--glass-border)]">
                <CardTitle className="text-sm font-black uppercase tracking-widest gradient-text">
                    État du stock
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
                {isLoading ? (
                    <Skeleton className="h-5 w-full rounded-full" />
                ) : (
                    <>
                        <div className="flex h-3 w-full rounded-full overflow-hidden gap-0.5">
                            {pOk  > 0 && <div style={{ width: `${pOk}%`  }} className="bg-emerald-500 transition-all duration-700 rounded-l-full" />}
                            {pLow > 0 && <div style={{ width: `${pLow}%` }} className="bg-amber-500  transition-all duration-700" />}
                            {pOut > 0 && <div style={{ width: `${pOut}%` }} className="bg-red-500    transition-all duration-700 rounded-r-full" />}
                        </div>
                        <div className="flex items-center justify-between">
                            {[
                                { label: 'En stock', count: ok,         pct: pOk,  cls: 'bg-emerald-500' },
                                { label: 'Bas',       count: lowStock,  pct: pLow, cls: 'bg-amber-500'  },
                                { label: 'Rupture',   count: outOfStock,pct: pOut, cls: 'bg-red-500'    },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${item.cls}`} />
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                            {item.label}
                                        </p>
                                        <p className="text-base font-black tabular-nums leading-tight">
                                            {item.count}
                                            <span className="text-[9px] font-semibold text-muted-foreground/40 ml-1">
                                                ({item.pct.toFixed(0)}%)
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
});
StockBar.displayName = 'StockBar';

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const data = useLiveQuery<DashboardData | null>(
        async () => {
            if (!isMounted || !dateRange?.from || !dateRange?.to) return null;
            return await dashboardService.getDashboardData(dateRange.from, dateRange.to);
        },
        [isMounted, dateRange],
    );
    const dashboardData = data.value;

    const stockSummary = useLiveQuery<{ totalValue: number; outOfStock: number; lowStock: number; totalProducts: number }>(
        async () => inventoryService.getStockSummary(),
        [],
    );
    const inventoryData = stockSummary.value;

    const isLoading = data.value === undefined || !isMounted;

    const statCards = useMemo(() => [
        { title: 'Recettes',          value: formatCurrency(dashboardData?.stats.totalRevenue  ?? 0), icon: TrendingUp,    change: dashboardData?.stats.totalRevenueChange,  href: '/sales-history', color: 'primary'  as const },
        { title: 'Bénéfice',          value: formatCurrency(dashboardData?.stats.netProfit     ?? 0), icon: Percent,       change: dashboardData?.stats.netProfitChange,     color: 'emerald' as const },
        { title: 'Dépenses',          value: formatCurrency(dashboardData?.stats.totalExpenses ?? 0), icon: Wallet,        change: dashboardData?.stats.totalExpensesChange, positiveIsGood: false, color: 'red' as const },
        { title: 'Ventes',            value: String(dashboardData?.stats.saleCount            ?? 0),  icon: ShoppingCart,  change: dashboardData?.stats.saleCountChange,     href: '/sales-history', color: 'blue'  as const },
        { title: 'Dettes Clients',    value: formatCurrency(dashboardData?.stats.totalOutstandingDebt ?? 0), icon: Users, href: '/customers', color: 'violet' as const },
        { title: 'Panier Moyen',      value: formatCurrency(dashboardData?.stats.averageBasket ?? 0), icon: CreditCard,    color: 'primary' as const },
        { title: 'Valeur Stock',      value: formatCurrency(dashboardData?.stats.totalInventoryValue ?? 0), icon: Archive, href: '/products', color: 'emerald' as const },
        { title: 'Marge %',           value: `${(dashboardData?.stats.profitMargin ?? 0).toFixed(1)}%`, icon: TrendingUp,  color: 'blue'    as const },
    ], [dashboardData?.stats]);

    if (!isMounted) return null;

    return (
        <div className="p-4 sm:p-5 pb-24 max-w-[1800px] mx-auto space-y-5 animate-page-enter">
            <PageHeader
                title="Tableau de bord"
                description="Résumé de votre activité en un coup d'oeil"
                icon={LayoutDashboard}
            >
                <DateRangePicker date={dateRange} setDate={setDate} />
            </PageHeader>

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 stagger-children">
                {statCards.map(card => (
                    <StatCard key={card.title} {...card} isLoading={isLoading} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SalesChart data={dashboardData?.salesByDay ?? []} isLoading={isLoading} />
                <RecentActivity
                    sales={dashboardData?.recentSales   ?? []}
                    returns={dashboardData?.recentReturns ?? []}
                    isLoading={isLoading}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ProfitRing
                    margin={dashboardData?.stats.profitMargin ?? 0}
                    isLoading={isLoading}
                />
                <StockBar
                    total={inventoryData?.totalProducts ?? 0}
                    outOfStock={inventoryData?.outOfStock ?? 0}
                    lowStock={inventoryData?.lowStock ?? 0}
                    isLoading={stockSummary.value === undefined}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="overflow-hidden">
                    <CardHeader className="px-5 pt-5 pb-4 border-b border-[var(--glass-border)]">
                        <CardTitle className="text-base font-black gradient-text">Meilleurs produits</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
                        ) : (dashboardData?.topProducts ?? []).map((p, i) => (
                            <div key={p.productUuid}
                                style={{ animationDelay: `${i * 40}ms` }}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg
                                    border border-transparent hover:border-primary/15 hover:bg-primary/4
                                    transition-all duration-200 animate-slide-up">
                                <span className="text-[10px] font-black text-muted-foreground/50 w-5 shrink-0
                                    flex items-center justify-center w-6 h-6 rounded-full bg-muted/40">
                                    {i + 1}
                                </span>
                                <p className="text-sm font-semibold flex-1 truncate">{p.name}</p>
                                <div className="text-right">
                                    <p className="text-xs font-black text-primary tabular-nums">{p.quantitySold}u</p>
                                    <p className="text-[9px] text-muted-foreground/40 tabular-nums">{formatCurrency(p.revenueGenerated)}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader className="px-5 pt-5 pb-4 border-b border-[var(--glass-border)]">
                        <CardTitle className="text-base font-black gradient-text">Meilleurs clients</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
                        ) : (dashboardData?.topCustomers ?? []).map((c, i) => (
                            <Link key={c.customerUuid}
                                href={`/customers/detail?uuid=${c.customerUuid}`}
                                style={{ animationDelay: `${i * 40}ms` }}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg
                                    border border-transparent hover:border-primary/15 hover:bg-primary/4
                                    transition-all duration-200 group animate-slide-up">
                                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20
                                    flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-sm font-semibold flex-1 truncate group-hover:text-primary transition-colors">
                                    {c.name}
                                </p>
                                <span className="text-xs font-black text-primary tabular-nums">
                                    {formatCurrency(c.totalSpent)}
                                </span>
                            </Link>
                        ))}
                    </CardContent>
                </Card>

                <LowStockPanel products={dashboardData?.lowStockProducts ?? []} isLoading={isLoading} />
            </div>
        </div>
    );
}
