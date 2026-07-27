'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useDebouncedAbortSignal } from '@/hooks/useDebounce';
import { salesService } from '@/services/sales.service';
import { useDateRange } from '@/hooks/useDateRange';
import type { Sale, Customer, Payment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { 
    Search, LayoutGrid, List, RefreshCw, FilterX, TrendingUp, 
    Receipt as ReceiptIcon, FileDown, X
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
import { toast } from 'sonner';
import { cn, formatCurrency, safeToDate, safeNumber, formatDate } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { exportService } from '@/services/shared/export.service';

type SalesStatus = 'all' | 'paid' | 'partial' | 'unpaid';

export type HistoryItem = 
    | { type: 'sale'; data: Sale; date: Date }
    | { type: 'payment'; data: Payment; date: Date };

export default function SalesHistoryPage() {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => { setIsMounted(true); }, []);

    const viewMode = useAppStore(state => state.salesViewMode);
    const setViewMode = useAppStore(state => state.actions.setSalesViewMode);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<SalesStatus>('all');
    const { dateRange, setDate } = useDateRange(29);
    const debounced = useDebouncedAbortSignal(searchQuery, 300);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [isBulkCancelConfirmOpen, setIsBulkCancelConfirmOpen] = useState(false);

    const historyDataResult = useLiveQuery<HistoryItem[] | undefined>(async () => {
        if (!isMounted) return undefined;

        const filters = {
            query: debounced.debouncedValue,
            status: filterStatus,
            from: dateRange?.from,
            to: dateRange?.to
        };

        const sales = await salesService.filterSales(filters);

        let paymentsQuery = db.payments.toCollection();
        if (dateRange?.from) {
            paymentsQuery = db.payments.where('paymentDate').between(startOfDay(dateRange.from), endOfDay(dateRange.to || new Date()), true, true);
        }
        const rawPayments = await paymentsQuery.toArray();

        let filteredPayments = rawPayments;
        if (debounced.debouncedValue) {
            const q = debounced.debouncedValue.toLowerCase().trim();
            const matchingCustomers = await db.customers
                .filter(c => (c.firstName + ' ' + c.lastName).toLowerCase().includes(q) || (c.phone || '').includes(q))
                .toArray();
            const matchingCustomerUuids = new Set(matchingCustomers.map(c => c.uuid));
            filteredPayments = rawPayments.filter(p => matchingCustomerUuids.has(p.customerUuid));
        }

        if (filterStatus !== 'all' && filterStatus !== 'paid') {
            filteredPayments = [];
        }

        const combined: HistoryItem[] = [
            ...sales.map(s => ({ type: 'sale' as const, data: s, date: safeToDate(s.createdAt!) })),
            ...filteredPayments.map(p => ({ type: 'payment' as const, data: p, date: safeToDate(p.paymentDate) }))
        ];

        return combined
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 500);
    }, [isMounted, debounced.debouncedValue, filterStatus, dateRange]);

    const historyData = historyDataResult.value;
    const customersResult = useLiveQuery<Customer[]>(() => db.customers.toArray());
    const customers = customersResult.value ?? [];
    const customerMap = useMemo(() => new Map(customers.map(c => [c.uuid, c])), [customers]);
    const isLoading = historyDataResult.isLoading || !isMounted;

    const stats = useMemo(() => {
        if (!historyData) return { totalRevenue: 0, totalReceived: 0, totalDebt: 0, count: 0 };
        let revCents = 0; let recCents = 0;
        historyData.forEach(item => {
            if (item.type === 'sale' && !item.data.isCancelled) {
                revCents += Math.round(safeNumber(item.data.total) * 100);
                recCents += Math.round(safeNumber(item.data.amountPaid) * 100);
            } else if (item.type === 'payment') {
                recCents += Math.round(safeNumber(item.data.amount) * 100);
            }
        });
        return { 
            totalRevenue: revCents / 100, 
            totalReceived: recCents / 100, 
            totalDebt: Math.max(0, (revCents - recCents) / 100)
        };
    }, [historyData]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid); else next.add(uuid);
            return next;
        });
    };

    const handleBulkCancel = async () => {
        const uuids = Array.from(selectedItems);
        let successCount = 0;
        for (const uuid of uuids) {
            try { await salesService.processSaleCancellation(uuid); successCount++; } catch (e) {}
        }
        if (successCount > 0) {
            toast.success(`${successCount} opérations annulées.`);
            historyDataResult.refresh();
        }
        setSelectedItems(new Set());
    };

    const handleExportCsv = () => {
        if (!historyData || historyData.length === 0) return;
        const toExport = selectedItems.size > 0 
            ? historyData.filter(item => selectedItems.has(item.data.uuid))
            : historyData;

        const data = toExport.map(item => ({
            'Date': formatDate(item.date, 'dd/MM/yyyy HH:mm'),
            'Type': item.type === 'sale' ? 'Vente' : 'Encaissement',
            'Référence': item.type === 'sale' ? item.data.invoiceNumber : 'PAIE-CLIENT',
            'Client': item.data.customerUuid ? `${customerMap.get(item.data.customerUuid)?.firstName} ${customerMap.get(item.data.customerUuid)?.lastName}` : 'Passage',
            'Total': item.type === 'sale' ? item.data.total : item.data.amount,
            'Statut': item.type === 'sale' ? (item.data.isCancelled ? 'Annulée' : item.data.paymentStatus) : 'Validé'
        }));

        exportService.exportToCsv(`journal-flux-${new Date().toISOString().split('T')[0]}`, data);
    };

    const resetFilters = () => { setSearchQuery(''); setFilterStatus('all'); setDate(undefined); };

    useKeyboardShortcuts([{ key: 'F3', action: () => searchInputRef.current?.focus(), description: 'Chercher dans le journal', ignoreInputFocus: true }], 'SalesHistory');

    const isFiltered = searchQuery !== '' || filterStatus !== 'all' || !!dateRange?.from;
    
    return (
        <div className="p-3 space-y-3 max-w-[1800px] mx-auto animate-in fade-in duration-500 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Journal des Flux Financiers</h1>
                    <p className="text-[9px] font-bold text-muted-foreground/50 tracking-widest uppercase mt-1">Archive centrale des ventes et recouvrements</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-8 rounded-lg font-bold text-[10px] uppercase gap-2">
                        <FileDown className="h-3.5 w-3.5" /> Exporter
                    </Button>
                    <DateRangePicker date={dateRange} setDate={setDate} className="h-8 text-[10px]" />
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => historyDataResult.refresh()}>
                        <RefreshCw className={cn("h-3.5 w-3.5 text-primary", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-1 space-y-3">
                    <Card className="rounded-xl border bg-card/50 shadow-sm overflow-hidden">
                        <CardContent className="p-3 space-y-3">
                            <div>
                                <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Volume de Ventes</p>
                                <p className="text-xl font-black tracking-tighter text-primary tabular-nums leading-none">{formatCurrency(stats.totalRevenue)}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/5">
                                <div>
                                    <p className="text-[7px] font-bold uppercase text-emerald-600/60 mb-0.5">Liquidités Perçues</p>
                                    <p className="font-black text-sm text-emerald-600 tracking-tight tabular-nums">{formatCurrency(stats.totalReceived)}</p>
                                </div>
                                <div>
                                    <p className="text-[7px] font-bold uppercase text-red-600/60 mb-0.5">Restes à Recouvrer</p>
                                    <p className="font-black text-sm text-red-600 tracking-tight tabular-nums">{formatCurrency(stats.totalDebt)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border bg-card/30 p-3 space-y-3">
                        <div className="relative group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                            <Input ref={searchInputRef} placeholder="Référence... [F3]" className="pl-8 h-8 rounded-lg bg-black/10 border-none font-bold text-[10px]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            {(['all', 'paid', 'partial', 'unpaid'] as SalesStatus[]).map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all", filterStatus === s ? "bg-primary text-primary-foreground" : "bg-black/5 text-muted-foreground/60 hover:bg-black/10")}>
                                    {s === 'all' ? 'Tout' : s === 'paid' ? 'Payé' : s === 'partial' ? 'Partiel' : 'Dette'}
                                </button>
                            ))}
                        </div>
                        {isFiltered && <Button variant="ghost" onClick={resetFilters} className="w-full text-destructive hover:bg-destructive/5 text-[8px] font-bold uppercase h-7 gap-1.5"><FilterX className="h-3 w-3" /> Réinitialiser</Button>}
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5 p-1 bg-muted/20 rounded-lg border">
                            <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-6 w-6 rounded-md" onClick={() => setViewMode('grid')}><LayoutGrid className="h-3.5 w-3.5"/></Button>
                            <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-6 w-6 rounded-md" onClick={() => setViewMode('list')}><List className="h-3.5 w-3.5"/></Button>
                        </div>
                        <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">{historyData?.length || 0} opérations archivées</span>
                    </div>

                    <div className="min-h-[500px]">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl bg-card/20 border-none animate-pulse" />)}
                            </div>
                        ) : historyData && historyData.length > 0 ? (
                            viewMode === 'list' ? (
                                <SalesHistoryTable 
                                    historyItems={historyData} 
                                    customerMap={customerMap as any} 
                                    selectedItems={selectedItems} 
                                    onToggleSelection={handleToggleSelection} 
                                    onViewDetails={(s) => { setSelectedSale(s); setIsDetailsOpen(true); }} 
                                    onPrint={(s) => { setSelectedSale(s); setIsPrintOpen(true); }} 
                                    onCancel={(s) => { setSelectedSale(s); setIsCancelOpen(true); }} 
                                />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                    {historyData.map(item => (
                                        item.type === 'sale' ? (
                                            <SalesHistoryCard key={item.data.uuid} sale={item.data} customerName={item.data.customerUuid ? `${customerMap.get(item.data.customerUuid)?.firstName} ${customerMap.get(item.data.customerUuid)?.lastName}` : 'Client de passage'} isSelected={selectedItems.has(item.data.uuid)} onToggleSelection={() => handleToggleSelection(item.data.uuid)} onViewDetails={(sale) => { setSelectedSale(sale); setIsDetailsOpen(true); }} onCancelSale={(sale) => { setSelectedSale(sale); setIsCancelOpen(true); }} />
                                        ) : (
                                            <Card key={item.data.uuid} className="rounded-xl border bg-card/30 p-3 relative overflow-hidden group shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[7px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">Paiement Client</span>
                                                    <span className="text-[7px] text-muted-foreground/30 font-bold uppercase">{format(item.date, 'd MMM, HH:mm', { locale: fr })}</span>
                                                </div>
                                                <p className="text-[8px] font-bold text-muted-foreground/40 uppercase">Montant encaissé</p>
                                                <p className="text-lg font-black text-emerald-600 tracking-tighter tabular-nums leading-none">{formatCurrency(item.data.amount)}</p>
                                                <div className="mt-2 pt-2 border-t border-white/5">
                                                    <p className="font-bold text-[10px] truncate uppercase">{customerMap.get(item.data.customerUuid)?.firstName} {customerMap.get(item.data.customerUuid)?.lastName}</p>
                                                </div>
                                            </Card>
                                        )
                                    ))}
                                </div>
                            )
                        ) : <EmptyState icon={ReceiptIcon} title="Journal vide" description="Aucune opération enregistrée sur cette période." />}
                    </div>
                </div>
            </div>

            {selectedItems.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/90 backdrop-blur-md border border-primary/20 shadow-2xl rounded-full px-5 py-2 flex items-center gap-4">
                        <span className="text-[9px] font-black uppercase text-primary">{selectedItems.size} sélectionnées</span>
                        <div className="h-3 w-px bg-border" />
                        <div className="flex items-center gap-3">
                            <button onClick={handleExportCsv} className="text-[8px] font-black uppercase hover:text-primary transition-colors">Exporter</button>
                            <button onClick={() => setIsBulkCancelConfirmOpen(true)} className="text-[8px] font-black uppercase text-destructive hover:opacity-80 transition-colors">Annuler</button>
                        </div>
                        <button onClick={() => setSelectedItems(new Set())} className="p-1 rounded-full hover:bg-white/10"><X className="h-3 w-3 opacity-20" /></button>
                    </div>
                </div>
            )}

            <SaleDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} sale={selectedSale} />
            <CancelSaleDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} sale={selectedSale} onSuccess={() => historyDataResult.refresh()} />
            <PrintReceiptDialog isOpen={isPrintOpen} onOpenChange={setIsPrintOpen} sale={selectedSale} customerName={selectedSale?.customerUuid ? (customerMap.get(selectedSale.customerUuid) ? `${customerMap.get(selectedSale.customerUuid)?.firstName} ${customerMap.get(selectedSale.customerUuid)?.lastName}` : undefined) : 'Passage'} />
            <ConfirmAlertDialog isOpen={isBulkCancelConfirmOpen} onOpenChange={setIsBulkCancelConfirmOpen} title={`Annuler ${selectedItems.size} opérations ?`} description="Cette action restaurera les stocks et mettra à jour les soldes clients définitivement." onConfirm={handleBulkCancel} confirmText="Confirmer l'annulation" />
        </div>
    );
}
