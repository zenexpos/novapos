'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useDebouncedAbortSignal } from '@/hooks/useDebounce';
import { salesService } from '@/services/sales.service';
import { useDebounce } from '@/hooks/useDebounce';
import { useDateRange } from '@/hooks/useDateRange';
import type { Sale, Customer, Payment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { 
    Search, 
    History, 
    LayoutGrid, 
    List, 
    RefreshCw, 
    FilterX, 
    CheckCircle2, 
    Clock, 
    FileUp, 
    Banknote, 
    TrendingUp,
    ChevronRight,
    Sparkles,
    X,
    Trash2,
    Calendar,
    HandCoins,
    Receipt as ReceiptIcon
} from 'lucide-react';
import { SalesHistoryCard } from '@/components/sales/SalesHistoryCard';
import { SalesHistoryTable } from '@/components/sales/SalesHistoryTable';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { CancelSaleDialog } from '@/components/sales/CancelSaleDialog';
import { PrintReceiptDialog } from '@/components/sales/PrintReceiptDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { cn, formatCurrency, safeToDate, safeNumber } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';

type SalesStatus = 'all' | 'paid' | 'partial' | 'unpaid';

// Type unifié pour le registre (Ventes et Paiements)
export type HistoryItem = 
    | { type: 'sale'; data: Sale; date: Date }
    | { type: 'payment'; data: Payment; date: Date };

export default function SalesHistoryPage() {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.salesViewMode,
        setViewMode: state.actions.setSalesViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<SalesStatus>('all');
    const { dateRange, setDate } = useDateRange(29);
    const { debouncedValue: debouncedSearchQuery, signal } = useDebouncedAbortSignal(searchQuery, 300);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [isBulkCancelConfirmOpen, setIsBulkCancelConfirmOpen] = useState(false);

    // Source de données unifiée (Ventes + Règlements de dettes)
    const historyDataResult = useLiveQuery<HistoryItem[] | undefined>(async () => {
        if (!isMounted) return undefined;

        const filters = {
            query: debouncedSearchQuery,
            status: filterStatus,
            from: dateRange?.from,
            to: dateRange?.to
        };

        // 1. Récupération des ventes
        const sales = await salesService.filterSales(filters);

        // 2. Récupération des paiements autonomes (Encaissements de dettes)
        let paymentsQuery = db.payments.toCollection();
        if (dateRange?.from) {
            paymentsQuery = db.payments.where('paymentDate').between(startOfDay(dateRange.from), endOfDay(dateRange.to || new Date()), true, true);
        }
        const rawPayments = await paymentsQuery.toArray();

        // 3. Filtrage des paiements par recherche (nom client)
        let filteredPayments = rawPayments;
        if (debouncedSearchQuery) {
            const q = debouncedSearchQuery.toLowerCase().trim();
            const customers = await db.customers.toArray();
            const matchingCustomerUuids = new Set(
                customers
                    .filter(c => (c.firstName + ' ' + c.lastName).toLowerCase().includes(q))
                    .map(c => c.uuid)
            );
            filteredPayments = rawPayments.filter(p => matchingCustomerUuids.has(p.customerUuid));
        }

        // Si filtre par statut, les paiements ne sont affichés que pour 'all' ou 'paid'
        if (filterStatus !== 'all' && filterStatus !== 'paid') {
            filteredPayments = [];
        }

        // Fusion et tri chronologique
        const combined: HistoryItem[] = [
            ...sales.map(s => ({ type: 'sale' as const, data: s, date: safeToDate(s.createdAt!) })),
            ...filteredPayments.map(p => ({ type: 'payment' as const, data: p, date: safeToDate(p.paymentDate) }))
        ];

        return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [isMounted, debouncedSearchQuery, filterStatus, dateRange, signal]);
    const historyData = historyDataResult.value;

    const customersResult = useLiveQuery<Customer[]>(() => db.customers.toArray());
    const customers = customersResult.value ?? [];
    const customerMap = useMemo(() => new Map(customers.map(c => [c.uuid, c])), [customers]);

    const isLoading = historyDataResult.isLoading || !isMounted;

    // FIX: Pagination — load 50 records at a time instead of rendering all at once.
    // Prevents UI freeze on 1000+ records. Load more on scroll via Intersection Observer.
    const PAGE_SIZE = 50;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE); // Reset on filter change
    }, [historyData]);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && historyData && visibleCount < historyData.length) {
                    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, historyData.length));
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [historyData, visibleCount]);

    const visibleHistory = useMemo(
        () => historyData?.slice(0, visibleCount) ?? [],
        [historyData, visibleCount]
    );

    // Statistiques intelligentes (Bilan des Flux) — computed over FULL data, not just visible
    const stats = useMemo(() => {
        if (!historyData) return { totalRevenue: 0, totalReceived: 0, totalDebt: 0, count: 0 };
        
        let revenueCents = 0;
        let receivedCents = 0;
        let saleCount = 0;

        historyData.forEach(item => {
            if (item.type === 'sale') {
                revenueCents += Math.round(safeNumber(item.data.total) * 100);
                receivedCents += Math.round(safeNumber(item.data.amountPaid) * 100);
                saleCount++;
            } else {
                // Les règlements augmentent uniquement les encaissements sans impacter le chiffre d'affaires
                receivedCents += Math.round(safeNumber(item.data.amount) * 100);
            }
        });

        return {
            totalRevenue: revenueCents / 100,
            totalReceived: receivedCents / 100,
            totalDebt: Math.max(0, (revenueCents - receivedCents) / 100),
            count: saleCount
        };
    }, [historyData]);

    const chartData = useMemo(() => {
        if (!historyData || historyData.length === 0) return [];
        
        const dataMap = new Map<string, { fullDate: string, totalCents: number, receivedCents: number }>();
        
        historyData.forEach(item => {
            const sortKey = format(item.date, 'yyyy-MM-dd');
            const current = dataMap.get(sortKey) || { fullDate: sortKey, totalCents: 0, receivedCents: 0 };
            
            if (item.type === 'sale') {
                current.totalCents += Math.round(safeNumber(item.data.total) * 100);
                current.receivedCents += Math.round(safeNumber(item.data.amountPaid) * 100);
            } else {
                current.receivedCents += Math.round(safeNumber(item.data.amount) * 100);
            }
            
            dataMap.set(sortKey, current);
        });

        return Array.from(dataMap.values())
            .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
            .map(d => ({
                date: format(parseISO(d.fullDate), 'dd/MM'),
                total: d.totalCents / 100,
                received: d.receivedCents / 100
            }));
    }, [historyData]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (!historyData) return;
        if (selectedItems.size === historyData.length) setSelectedItems(new Set());
        else setSelectedItems(new Set(visibleHistory.map(item => item.data.uuid)));
    };

    const handleBulkCancel = async () => {
        const uuids = Array.from(selectedItems);
        let successCount = 0;
        for (const uuid of uuids) {
            try { 
                // Seules les ventes peuvent être annulées via cette action groupée
                await salesService.processSaleCancellation(uuid); 
                successCount++; 
            } catch (e) {}
        }
        if (successCount > 0) toast.success(`${successCount} opération(s) annulée(s).`);
        setSelectedItems(new Set());
    };

    const resetFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
        setDate(undefined);
    };

    useKeyboardShortcuts([
        { key: 'F3', action: () => searchInputRef.current?.focus(), description: 'Rechercher un flux', ignoreInputFocus: true }
    ], 'Historique');

    const isFiltered = searchQuery !== '' || filterStatus !== 'all' || !!dateRange?.from;
    
    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000 pb-20">
            <PageHeader title="Flux Financiers Elite" description="Registre unifié des ventes et encaissements de dettes">
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <div className="flex items-center bg-card/40 backdrop-blur-md rounded-2xl border border-white/5 p-1 shadow-inner group">
                        <DateRangePicker date={dateRange} setDate={setDate} />
                        {!dateRange?.from && (
                            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase px-3 py-1 animate-pulse">
                                Archive Complète
                            </Badge>
                        )}
                    </div>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/5 bg-card/40 hover:bg-primary/10 transition-all" onClick={() => window.location.reload()}>
                        <RefreshCw className="h-5 w-5 text-primary" />
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1 space-y-4">
                    <Card className="app-card rounded-lg glass overflow-hidden shadow-sm">
                        <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
                            <CardTitle className="text-[10px] font-black uppercase text-primary flex items-center gap-2 tracking-widest">
                                <Sparkles className="h-3.5 w-3.5" /> Bilan de Période
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase">Chiffre d'Affaires</p>
                                <p className="text-3xl font-black tracking-tighter text-primary tabular-nums">{formatCurrency(stats.totalRevenue)}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 pt-2">
                                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 shadow-inner group hover:bg-emerald-500/10 transition-all">
                                    <p className="text-[9px] font-semibold uppercase text-emerald-600 mb-1">Total Encaissé (Revenu + Dettes)</p>
                                    <p className="font-bold text-xl text-emerald-600 tracking-tight tabular-nums">{formatCurrency(stats.totalReceived)}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 shadow-inner group hover:bg-destructive/10 transition-all">
                                    <p className="text-[9px] font-semibold uppercase text-destructive mb-1">Reste à Recouvrer</p>
                                    <p className="font-bold text-xl text-destructive tracking-tight tabular-nums">{formatCurrency(stats.totalDebt)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="app-card rounded-lg glass p-6 space-y-6 shadow-sm">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input ref={searchInputRef} placeholder="Chercher un flux... [F3]" className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold text-lg" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="space-y-4 animate-page-enter">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground/40 ml-1">Statut des Ventes</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between rounded-xl h-12 bg-black/20 border-white/5 text-xs font-semibold uppercase">
                                        <div className="flex items-center gap-3"><Banknote className="h-4 w-4 text-primary" />{filterStatus === 'all' ? 'Tous les flux' : filterStatus === 'paid' ? 'Soldés' : filterStatus === 'partial' ? 'Partiels' : 'À crédit'}</div>
                                        <ChevronRight className="h-3 w-3 opacity-30" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[240px] rounded-2xl border-white/10 bg-card/95 backdrop-blur-md shadow-2xl">
                                    <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'all'} onCheckedChange={() => setFilterStatus('all')}>Tous les flux</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'paid'} onCheckedChange={() => setFilterStatus('paid')}>Règlements complets</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'partial'} onCheckedChange={() => setFilterStatus('partial')}>Paiements partiels</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem className="p-3 font-bold" checked={filterStatus === 'unpaid'} onCheckedChange={() => setFilterStatus('unpaid')}>Dettes totales</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        {isFiltered && (
                            <Button variant="ghost" onClick={resetFilters} className="w-full text-destructive hover:bg-destructive/10 text-[10px] font-bold uppercase rounded-xl h-12 gap-2">
                                <FilterX className="h-4 w-4" /> Réinitialiser
                            </Button>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-3 space-y-4">
                    <Card className="app-card rounded-lg glass overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-white/5 bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-sm"><TrendingUp className="h-6 w-6" /></div>
                                <div>
                                    <CardTitle className="text-xl font-bold tracking-tighter uppercase">Flux de Liquidité</CardTitle>
                                    <p className="text-[10px] font-semibold uppercase text-primary/50 tracking-widest">Variation des revenus et des remboursements de dettes</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 p-1.5 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                                <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                                <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="h-72 p-4">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center opacity-20"><RefreshCw className="animate-spin h-10 w-10 text-primary" /></div>
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-tertiary))" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="hsl(var(--chart-tertiary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.2)" />
                                        <XAxis dataKey="date" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground) / 0.4)" dy={15} />
                                        <YAxis fontSize={10} fontWeight="900" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground) / 0.4)" dx={-15} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card) / 0.9)', backdropFilter: 'blur(16px)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)'}} itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }} formatter={(v: number, name: string) => [formatCurrency(v), name === 'total' ? 'Chiffre Affaire' : 'Flux Reçu']} />
                                        <Area type="monotone" dataKey="total" name="total" stroke="hsl(var(--chart-primary))" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={4} isAnimationActive={false} />
                                        <Area type="monotone" dataKey="received" name="received" stroke="hsl(var(--chart-tertiary))" fillOpacity={1} fill="url(#colorReceived)" strokeWidth={2} strokeDasharray="5 5" isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex flex-col items-center justify-center opacity-20 uppercase text-[10px] font-black italic gap-4">
                                <Calendar className="h-12 w-12" /> Aucun flux détecté
                            </div>}
                        </CardContent>
                    </Card>

                    <div className="min-h-[600px] animate-in fade-in duration-500">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-lg bg-card/40 animate-pulse border border-white/5" />)}
                            </div>
                        ) : historyData && historyData.length > 0 ? (
                            <div className="space-y-4">
                                {viewMode === 'list' ? (
                                    <SalesHistoryTable 
                                        historyItems={historyData} 
                                        customerMap={customerMap} 
                                        selectedItems={selectedItems} 
                                        onToggleSelection={handleToggleSelection} 
                                        onViewDetails={(s) => { setSelectedSale(s); setIsDetailsOpen(true); }} 
                                        onPrint={(s) => { setSelectedSale(s); setIsPrintOpen(true); }} 
                                        onCancel={(s) => { setSelectedSale(s); setIsCancelOpen(true); }} 
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {visibleHistory.map(item => (
                                            item.type === 'sale' ? (
                                                <SalesHistoryCard 
                                                    key={item.data.uuid} 
                                                    sale={item.data} 
                                                    customerName={item.data.customerUuid ? `${customerMap.get(item.data.customerUuid)?.firstName} ${customerMap.get(item.data.customerUuid)?.lastName}` : 'Client de passage'} 
                                                    isSelected={selectedItems.has(item.data.uuid)} 
                                                    onToggleSelection={() => handleToggleSelection(item.data.uuid)} 
                                                    onViewDetails={(sale) => { setSelectedSale(sale); setIsDetailsOpen(true); }} 
                                                    onCancelSale={(sale) => { setSelectedSale(sale); setIsCancelOpen(true); }} 
                                                />
                                            ) : (
                                                <Card key={item.data.uuid} className="app-card group bg-emerald-500/5 backdrop-blur-sm border-emerald-500/10 relative overflow-hidden rounded-lg p-6">
                                                    <div className="absolute -right-4 -top-4 opacity-[0.05] text-emerald-500 group-hover:opacity-10 transition-opacity">
                                                        <HandCoins className="h-32 w-32 rotate-12" />
                                                    </div>
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
                                                            <HandCoins className="h-6 w-6" />
                                                        </div>
                                                        <Badge className="bg-emerald-500 text-white border-none uppercase text-[8px] font-black px-3 py-1">Paiement Reçu</Badge>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase">Encaissement Dette</p>
                                                        <p className="text-2xl font-black text-emerald-600 tracking-tighter tabular-nums">{formatCurrency(item.data.amount)}</p>
                                                    </div>
                                                    <div className="mt-4 flex flex-col gap-2">
                                                        <p className="font-bold text-sm tracking-tight truncate">
                                                            {customerMap.get(item.data.customerUuid)?.firstName} {customerMap.get(item.data.customerUuid)?.lastName}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40 font-semibold uppercase tracking-wide">
                                                            <Clock className="h-3 w-3 opacity-50" />
                                                            {format(item.date, 'd MMMM, HH:mm', { locale: fr })}
                                                        </div>
                                                    </div>
                                                </Card>
                                            )
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : <EmptyState icon={History} title="Archives Vides" description={isFiltered ? "Ajustez vos filtres de recherche." : "Validez votre première transaction Elite."} />}
                    </div>
                </div>
            </div>

            {selectedItems.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-2xl rounded-full px-8 py-4 flex items-center gap-4">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10"><div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black">{selectedItems.size}</div><span className="text-[10px] font-black uppercase text-muted-foreground">Sélections</span></div>
                        <Button variant="ghost" onClick={() => setIsBulkCancelConfirmOpen(true)} className="rounded-full h-12 px-6 font-black text-[10px] uppercase text-destructive hover:bg-destructive/10 transition-all"><Trash2 className="mr-2 h-4 w-4" /> Annuler Flux</Button>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedItems(new Set())} className="rounded-full h-12 w-12 hover:bg-white/5"><X className="h-4 w-4" /></Button>
                    </div>
                </div>
            )}

            <SaleDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} sale={selectedSale} />
            <CancelSaleDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} sale={selectedSale} onSuccess={() => setSelectedItems(new Set())} />
            <PrintReceiptDialog isOpen={isPrintOpen} onOpenChange={setIsPrintOpen} sale={selectedSale} customerName={selectedSale?.customerUuid ? (customerMap.get(selectedSale.customerUuid) ? `${customerMap.get(selectedSale.customerUuid)?.firstName} ${customerMap.get(selectedSale.customerUuid)?.lastName}` : undefined) : 'Client de passage'} />
            <ConfirmAlertDialog isOpen={isBulkCancelConfirmOpen} onOpenChange={setIsBulkCancelConfirmOpen} title={`Annuler ${selectedItems.size} opérations ?`} description="Action définitive : réintégration du stock et ajustement des soldes clients." onConfirm={handleBulkCancel} confirmText="Confirmer Annulation" />
        </div>
    );
}
