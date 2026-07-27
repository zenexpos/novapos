'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useDebouncedAbortSignal } from '@/hooks/useDebounce';
import { salesService } from '@/services/sales.service';
import { useDateRange } from '@/hooks/useDateRange';
import type { Sale, Customer, Payment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { 
    Search, 
    LayoutGrid, 
    List, 
    RefreshCw, 
    FilterX, 
    TrendingUp,
    Calendar,
    HandCoins,
    Receipt as ReceiptIcon,
    FileDown,
    X
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
import { Badge } from '@/components/ui/badge';
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
        let revCents = 0; let recCents = 0; let count = 0;
        historyData.forEach(item => {
            if (item.type === 'sale' && !item.data.isCancelled) {
                revCents += Math.round(safeNumber(item.data.total) * 100);
                recCents += Math.round(safeNumber(item.data.amountPaid) * 100);
                count++;
            } else if (item.type === 'payment') {
                recCents += Math.round(safeNumber(item.data.amount) * 100);
            }
        });
        return { 
            totalRevenue: revCents / 100, 
            totalReceived: recCents / 100, 
            totalDebt: Math.max(0, (revCents - recCents) / 100), 
            count 
        };
    }, [historyData]);

    const chartData = useMemo(() => {
        if (!historyData || historyData.length === 0) return [];
        const dataMap = new Map<string, { fullDate: string, totalCents: number, receivedCents: number }>();
        historyData.forEach(item => {
            const sortKey = format(item.date, 'yyyy-MM-dd');
            const current = dataMap.get(sortKey) || { fullDate: sortKey, totalCents: 0, receivedCents: 0 };
            if (item.type === 'sale' && !item.data.isCancelled) {
                current.totalCents += Math.round(safeNumber(item.data.total) * 100);
                current.receivedCents += Math.round(safeNumber(item.data.amountPaid) * 100);
            } else if (item.type === 'payment') {
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
            toast.success(`${successCount} فاتورة ملغاة.`);
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
            'التاريخ': formatDate(item.date, 'dd/MM/yyyy HH:mm'),
            'النوع': item.type === 'sale' ? 'بيع' : 'تحصيل دين',
            'المرجع': item.type === 'sale' ? item.data.invoiceNumber : 'CASH-RCV',
            'العميل': item.data.customerUuid ? `${customerMap.get(item.data.customerUuid)?.firstName} ${customerMap.get(item.data.customerUuid)?.lastName}` : 'عابر',
            'إجمالي العملية': item.type === 'sale' ? item.data.total : item.data.amount,
            'المقبوض': item.type === 'sale' ? item.data.amountPaid : item.data.amount,
            'الحالة': item.type === 'sale' ? (item.data.isCancelled ? 'ملغاة' : item.data.paymentStatus) : 'منجز'
        }));

        exportService.exportToCsv(`سجل-التدفقات-${new Date().toISOString().split('T')[0]}`, data);
    };

    const resetFilters = () => { setSearchQuery(''); setFilterStatus('all'); setDate(undefined); };

    useKeyboardShortcuts([{ key: 'F3', action: () => searchInputRef.current?.focus(), description: 'بحث في السجل', ignoreInputFocus: true }], 'SalesHistory');

    const isFiltered = searchQuery !== '' || filterStatus !== 'all' || !!dateRange?.from;
    
    return (
        <div className="p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-500 pb-24">
            <PageHeader title="سجل التدفقات المالية" description="الأرشيف المركزي للمبيعات وتحصيل الديون">
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCsv} className="rounded-lg font-bold gap-2">
                        <FileDown className="h-4 w-4" /> تصدير
                    </Button>
                    <DateRangePicker date={dateRange} setDate={setDate} className="h-9" />
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={() => historyDataResult.refresh()}>
                        <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-1 space-y-4">
                    <Card className="rounded-xl border-none bg-card/40 shadow-sm overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5 p-4">
                            <CardTitle className="text-[10px] font-black uppercase text-primary tracking-widest">الأداء المالي</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase">حجم المبيعات</p>
                                <p className="text-2xl font-black tracking-tighter text-primary tabular-nums">{formatCurrency(stats.totalRevenue)}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                <p className="text-[8px] font-bold uppercase text-emerald-600 mb-0.5">السيولة المحصلة</p>
                                <p className="font-black text-lg text-emerald-600 tracking-tight tabular-nums">{formatCurrency(stats.totalReceived)}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                <p className="text-[8px] font-bold uppercase text-red-600 mb-0.5">ديون قيد التحصيل</p>
                                <p className="font-black text-lg text-red-600 tracking-tight tabular-nums">{formatCurrency(stats.totalDebt)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-none bg-card/40 p-4 space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                            <Input ref={searchInputRef} placeholder="رقم الفاتورة... [F3]" className="pl-9 h-9 rounded-lg bg-black/20 border-none font-bold text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {(['all', 'paid', 'partial', 'unpaid'] as SalesStatus[]).map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-2 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-wider transition-all", filterStatus === s ? "bg-primary text-primary-foreground border-primary" : "bg-black/10 border-transparent text-muted-foreground/60 hover:bg-black/20")}>
                                    {s === 'all' ? 'الكل' : s === 'paid' ? 'مسددة' : s === 'partial' ? 'جزئية' : 'ديون'}
                                </button>
                            ))}
                        </div>
                        {isFiltered && <Button variant="ghost" onClick={resetFilters} className="w-full text-destructive hover:bg-destructive/10 text-[9px] font-bold uppercase rounded-lg h-8 gap-2"><FilterX className="h-3 w-3" /> تصفير</Button>}
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-4">
                    <Card className="rounded-xl border-none bg-card/40 shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-white/5 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary"><TrendingUp className="h-4 w-4" /></div>
                                <CardTitle className="text-sm font-black tracking-tight uppercase">التدفق الزمني</CardTitle>
                            </div>
                            <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg">
                                <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-md h-7 w-7" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                                <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-md h-7 w-7" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="h-48 p-2">
                            {!isLoading && chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.05)" />
                                        <XAxis dataKey="date" fontSize={8} fontWeight="900" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground) / 0.4)" dy={5} />
                                        <YAxis fontSize={8} fontWeight="900" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground) / 0.4)" />
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card) / 0.9)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)'}} itemStyle={{ fontSize: '10px', fontWeight: '900' }} />
                                        <Area type="monotone" dataKey="total" name="المبيعات" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center opacity-10 text-[10px] font-black uppercase">لا توجد بيانات</div>}
                        </CardContent>
                    </Card>

                    <div className="min-h-[400px]">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl bg-card/40 border border-white/5 animate-pulse" />)}
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {historyData.map(item => (
                                        item.type === 'sale' ? (
                                            <SalesHistoryCard key={item.data.uuid} sale={item.data} customerName={item.data.customerUuid ? `${customerMap.get(item.data.customerUuid)?.firstName} ${customerMap.get(item.data.customerUuid)?.lastName}` : 'عابر'} isSelected={selectedItems.has(item.data.uuid)} onToggleSelection={() => handleToggleSelection(item.data.uuid)} onViewDetails={(sale) => { setSelectedSale(sale); setIsDetailsOpen(true); }} onCancelSale={(sale) => { setSelectedSale(sale); setIsCancelOpen(true); }} />
                                        ) : (
                                            <Card key={item.data.uuid} className="rounded-xl border-none bg-card/40 p-4 relative overflow-hidden group shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><HandCoins className="h-4 w-4" /></div>
                                                    <Badge className="bg-emerald-500 text-white border-none uppercase text-[7px] font-black px-1.5 py-0">تحصيل</Badge>
                                                </div>
                                                <p className="text-[8px] font-bold text-muted-foreground/40 uppercase">المبلغ المقبوض</p>
                                                <p className="text-xl font-black text-emerald-600 tracking-tighter tabular-nums">{formatCurrency(item.data.amount)}</p>
                                                <div className="mt-3 pt-3 border-t border-white/5">
                                                    <p className="font-black text-xs truncate uppercase">{customerMap.get(item.data.customerUuid)?.firstName} {customerMap.get(item.data.customerUuid)?.lastName}</p>
                                                    <p className="text-[7px] text-muted-foreground/30 font-bold uppercase mt-1">{format(item.date, 'd MMMM, HH:mm', { locale: fr })}</p>
                                                </div>
                                            </Card>
                                        )
                                    ))}
                                </div>
                            )
                        ) : <EmptyState icon={ReceiptIcon} title="السجل فارغ" description="لم يتم تسجيل أي عمليات." />}
                    </div>
                </div>
            </div>

            {selectedItems.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/90 backdrop-blur-md border border-primary/20 shadow-2xl rounded-full px-6 py-2.5 flex items-center gap-6">
                        <span className="text-[9px] font-black uppercase text-primary">{selectedItems.size} فواتير</span>
                        <div className="flex items-center gap-2">
                            <button onClick={handleExportCsv} className="text-[9px] font-black uppercase hover:text-primary transition-colors">تصدير</button>
                            <button onClick={() => setIsBulkCancelConfirmOpen(true)} className="text-[9px] font-black uppercase text-destructive hover:opacity-80 transition-colors">إلغاء</button>
                        </div>
                        <button onClick={() => setSelectedItems(new Set())} className="p-1 rounded-full hover:bg-white/10"><X className="h-3.5 w-3.5 opacity-20" /></button>
                    </div>
                </div>
            )}

            <SaleDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} sale={selectedSale} />
            <CancelSaleDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} sale={selectedSale} onSuccess={() => historyDataResult.refresh()} />
            <PrintReceiptDialog isOpen={isPrintOpen} onOpenChange={setIsPrintOpen} sale={selectedSale} customerName={selectedSale?.customerUuid ? (customerMap.get(selectedSale.customerUuid) ? `${customerMap.get(selectedSale.customerUuid)?.firstName} ${customerMap.get(selectedSale.customerUuid)?.lastName}` : undefined) : 'عابر'} />
            <ConfirmAlertDialog isOpen={isBulkCancelConfirmOpen} onOpenChange={setIsBulkCancelConfirmOpen} title={`إلغاء ${selectedItems.size} عملية؟`} description="سيتم حذف العمليات وإرجاع السلع للمخزون وتحديث أرصدة العملاء." onConfirm={handleBulkCancel} confirmText="تأكيد الإلغاء" />
        </div>
    );
}
