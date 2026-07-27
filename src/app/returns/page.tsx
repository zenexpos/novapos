'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useDebouncedAbortSignal } from '@/hooks/useDebounce';
import type { ProductReturn, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Search, 
    Plus, 
    Undo2, 
    LayoutGrid, 
    List, 
    FileUp, 
    X,
    RefreshCw
} from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Skeleton } from '@/components/ui/skeleton';
import { ReturnHistoryCard } from '@/components/returns/ReturnHistoryCard';
import { ReturnTable } from '@/components/returns/ReturnTable';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import { CancelReturnDialog } from '@/components/returns/CancelReturnDialog';
import { ReturnStats } from '@/components/returns/ReturnStats';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import Papa from 'papaparse';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';
import { returnService } from '@/services/return.service';

export default function ReturnsPage() {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => { setIsMounted(true); }, []);
    
    const viewMode = useAppStore(state => state.returnsViewMode);
    const setViewMode = useAppStore(state => state.actions.setReturnsViewMode);

    const [searchQuery, setSearchQuery] = useState('');
    const { debouncedValue: debouncedSearchQuery } = useDebouncedAbortSignal(searchQuery, 300);
    const { dateRange, setDate } = useDateRange(29);
    
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [selectedReturns, setSelectedReturns] = useState<Set<string>>(new Set());
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isBulkCancelConfirmOpen, setIsBulkCancelConfirmOpen] = useState(false);

    const returnsResult = useLiveQuery<ProductReturn[]>(async () => {
       if (!isMounted || !dateRange?.from) return [];
       const start = startOfDay(dateRange.from);
       const end = endOfDay(dateRange.to || new Date());
       
       let collection = db.product_returns.where('createdAt').between(start, end, true, true);
       let results = await collection.toArray();

       if (debouncedSearchQuery) {
           const q = debouncedSearchQuery.toLowerCase();
           results = results.filter(r => r.originalInvoiceNumber.toLowerCase().includes(q));
       }

       return results.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
   }, [isMounted, dateRange, debouncedSearchQuery]);
    
    const returns = returnsResult.value ?? [];
    const isLoading = returnsResult.isLoading || !isMounted;

    const customersResult = useLiveQuery<Customer[]>(() => db.customers.toArray());
    const customerMap = useMemo(() => new Map((customersResult.value || []).map(c => [c.uuid, c])), [customersResult.value]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedReturns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) next.delete(uuid); else next.add(uuid);
            return newSet;
        });
    };

    const handleBulkCancel = async () => {
        const uuids = Array.from(selectedReturns);
        let successCount = 0;
        for (const uuid of uuids) {
            try {
                await returnService.processReturnCancellation(uuid);
                successCount++;
            } catch (e) {}
        }
        if (successCount > 0) {
            toast.success(`${successCount} retour(s) annulé(s).`);
            returnsResult.refresh();
        }
        setSelectedReturns(new Set());
        setIsBulkCancelConfirmOpen(false);
    };

    const handleExportCsv = () => {
        const toExport = selectedReturns.size > 0 
            ? (returns?.filter(r => selectedReturns.has(r.uuid)) || [])
            : (returns || []);

        if (toExport.length === 0) return;

        const csvData = toExport.map(r => ({
            Date: r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : 'N/A',
            'Facture Originale': r.originalInvoiceNumber,
            Client: r.customerUuid ? `${customerMap.get(r.customerUuid)?.firstName} ${customerMap.get(r.customerUuid)?.lastName}` : 'Passage',
            'Valeur Retour': r.totalReturnValue,
            'Montant Remboursé': r.amountRefunded,
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `retours-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success(`${toExport.length} retour(s) exporté(s).`);
    };

    const handleViewDetails = (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsDetailsOpen(true);
    };

    const handleCancelReturn = (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsCancelOpen(true);
    };

    useKeyboardShortcuts([
        { key: 'F3', action: () => searchInputRef.current?.focus(), description: 'Rechercher un retour', ignoreInputFocus: true },
        { key: 'n', action: () => {}, description: 'Nouveau retour', ignoreInputFocus: false }
    ], 'Retours', isMounted);

    return (
        <div className="p-2 space-y-2 max-w-[1800px] mx-auto animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div>
                    <h1 className="text-lg font-black tracking-tighter uppercase leading-none">Registre المرتجعات</h1>
                    <p className="text-[8px] font-bold text-muted-foreground/50 tracking-widest uppercase mt-0.5">Régularisation des flux marchandises</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-7 rounded-lg font-bold text-[9px] uppercase gap-1.5">
                        <FileUp className="h-3 w-3" /> تصدير
                    </Button>
                    <Button asChild size="sm" className="h-7 rounded-lg font-black text-[9px] uppercase gap-1.5 shadow-sm">
                        <Link href="/returns/new"><Plus className="h-3 w-3" /> Nouveau</Link>
                    </Button>
                </div>
            </div>

            <ReturnStats returns={returns} isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 bg-card/30 p-1 rounded-xl border">
                <div className="relative group flex-grow max-w-xl">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                    <Input 
                        ref={searchInputRef}
                        placeholder="N° Facture... [F3]"
                        className="pl-8 h-8 rounded-lg bg-black/10 border-none font-bold text-[10px]"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1.5">
                    <DateRangePicker date={dateRange} setDate={setDate} className="h-8 text-[9px] sm:w-[200px]" />
                    <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-lg border">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-6 w-6 rounded-md" onClick={() => setViewMode('grid')}><LayoutGrid className="h-3.5 w-3.5"/></Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-6 w-6 rounded-md" onClick={() => setViewMode('list')}><List className="h-3.5 w-3.5"/></Button>
                    </div>
                </div>
            </div>

            <div className="min-h-[450px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl bg-card/20 border-none animate-pulse" />)}
                    </div>
                ) : returns.length === 0 ? (
                    <EmptyState icon={Undo2} title="Aucun retour" description={searchQuery ? "لا توجد نتائج مطابقة لبحثك." : "ابدأ بتسجيل أول عملية إرجاع سلع."} />
                ) : (
                    viewMode === 'list' ? (
                        <ReturnTable 
                            returns={returns}
                            customerMap={customerMap}
                            selectedReturns={selectedReturns}
                            onToggleSelection={handleToggleSelection}
                            onViewDetails={handleViewDetails}
                            onCancel={handleCancelReturn}
                        />
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1.5">
                            {returns.map(r => (
                                <ReturnHistoryCard 
                                    key={r.uuid} 
                                    productReturn={r}
                                    customerName={r.customerUuid ? `${customerMap.get(r.customerUuid)?.firstName} ${customerMap.get(r.customerUuid)?.lastName}` : 'زبون عابر'}
                                    isSelected={selectedReturns.has(r.uuid)}
                                    onToggleSelection={() => handleToggleSelection(r.uuid)}
                                    onViewDetails={handleViewDetails}
                                    onCancelReturn={handleCancelReturn}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>

            {selectedReturns.size > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10">
                    <div className="bg-card/90 backdrop-blur-md border border-primary/20 shadow-2xl rounded-full px-5 py-2 flex items-center gap-4">
                        <span className="text-[9px] font-black uppercase text-primary">{selectedReturns.size} عمليات</span>
                        <div className="h-3 w-px bg-border" />
                        <div className="flex items-center gap-3">
                            <button onClick={handleExportCsv} className="text-[8px] font-black uppercase hover:text-primary transition-colors">تصدير</button>
                            <button onClick={() => setIsBulkCancelConfirmOpen(true)} className="text-[8px] font-black uppercase text-destructive hover:opacity-80 transition-colors">إلغاء</button>
                        </div>
                        <button onClick={() => setSelectedReturns(new Set())} className="p-1 rounded-full hover:bg-white/10"><X className="h-3 w-3 opacity-20" /></button>
                    </div>
                </div>
            )}

            <ReturnDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} productReturn={selectedReturn} customerName={selectedReturn?.customerUuid ? `${customerMap.get(selectedReturn.customerUuid)?.firstName} ${customerMap.get(selectedReturn.customerUuid)?.lastName}` : 'زبون عابر'} />
            <CancelReturnDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} productReturn={selectedReturn} onSuccess={() => returnsResult.refresh()} />
            
            <ConfirmAlertDialog
                isOpen={isBulkCancelConfirmOpen}
                onOpenChange={setIsBulkCancelConfirmOpen}
                title={`Annuler ${selectedReturns.size} retours ?`}
                description="سيتم حذف العمليات المختارة وإرجاع السلع للمخزون وتحديث أرصدة العملاء بشكل دائم."
                onConfirm={handleBulkCancel}
                confirmText="تأكيد الإلغاء"
            />
        </div>
    );
}
