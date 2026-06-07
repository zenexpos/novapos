'use client';

import { useState, useMemo, useRef } from 'react';
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
    RefreshCw, 
    FilterX, 
    Trash2, 
    X
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
import { PageHeader } from '@/components/layout/PageHeader';
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
    
    // FIX: Individual selectors to avoid hydration loop in React 19
    const viewMode = useAppStore(state => state.returnsViewMode);
    const setViewMode = useAppStore(state => state.actions.setReturnsViewMode);

    const [searchQuery, setSearchQuery] = useState('');
    const { debouncedValue: debouncedSearchQuery, signal } = useDebouncedAbortSignal(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [selectedReturns, setSelectedReturns] = useState<Set<string>>(new Set());
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isBulkCancelConfirmOpen, setIsBulkCancelConfirmOpen] = useState(false);

    // ─── LIVE QUERIES ──────────────────────────────────────────

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
   }, [isMounted, dateRange, debouncedSearchQuery, signal]);
    const returns = returnsResult.value ?? [];

    const customersResult = useLiveQuery<Customer[]>(() => db.customers.toArray());
    const customers = customersResult.value ?? [];
    const customerMap = useMemo(() => new Map(customers.map(c => [c.uuid, c])), [customers]);

    const isLoading = returnsResult.isLoading || !isMounted;

    const handleToggleSelection = (uuid: string) => {
        setSelectedReturns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
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
        if (successCount > 0) toast.success(`${successCount} retour(s) annulé(s).`);
        setSelectedReturns(new Set());
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
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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

    const resetFilters = () => setSearchQuery('');

    useKeyboardShortcuts([
        {
            key: 'F3',
            action: () => searchInputRef.current?.focus(),
            description: 'Rechercher un retour',
            ignoreInputFocus: true
        }
    ], 'Retours');

    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader
                title="Registre des Retours"
                description="Régularisation Elite des flux de marchandises et des crédits"
            >
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportCsv} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide border-primary/20 hover:bg-primary/5 transition-all">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button asChild className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide shadow-xl shadow-sm transition-all active:scale-95">
                        <Link href="/returns/new"><Plus className="mr-2 h-4 w-4" /> Nouveau Retour</Link>
                    </Button>
                </div>
            </PageHeader>

            <ReturnStats returns={returns} isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/20 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
                <div className="relative group flex-grow max-w-xl px-4">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-500" />
                    <Input 
                        ref={searchInputRef}
                        placeholder="Rechercher par N° Facture [F3]..."
                        className="pl-14 h-9 rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20 font-bold text-lg"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3 px-4">
                    <DateRangePicker date={dateRange} setDate={setDate} />
                    <div className="flex items-center gap-1.5 p-1.5 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                    </div>
                </div>
            </div>

            <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-lg bg-card/40 animate-pulse" />)}
                    </div>
                ) : returns.length === 0 ? (
                    <EmptyState icon={Undo2} title="Aucun retour" description={searchQuery ? "Ajustez vos filtres." : "Commencez par enregistrer un retour."} />
                ) : (
                    viewMode === 'list' ? (
                        <ReturnTable 
                            returns={returns}
                            customerMap={customerMap as any}
                            selectedReturns={selectedReturns}
                            onToggleSelection={handleToggleSelection}
                            onViewDetails={handleViewDetails}
                            onCancel={handleCancelReturn}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {returns.map(r => {
                                const customer = r.customerUuid ? customerMap.get(r.customerUuid) : undefined;
                                return (
                                    <ReturnHistoryCard 
                                        key={r.uuid} 
                                        productReturn={r}
                                        customerName={customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'}
                                        isSelected={selectedReturns.has(r.uuid)}
                                        onToggleSelection={() => handleToggleSelection(r.uuid)}
                                        onViewDetails={handleViewDetails}
                                        onCancelReturn={handleCancelReturn}
                                    />
                                )
                            })}
                        </div>
                    )
                )}
            </div>

            <ReturnDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} productReturn={selectedReturn} customerName={selectedReturn?.customerUuid ? `${customerMap.get(selectedReturn.customerUuid)?.firstName} ${customerMap.get(selectedReturn.customerUuid)?.lastName}` : 'Client de passage'} />
            <CancelReturnDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} productReturn={selectedReturn} onSuccess={() => {}} />
            
            <ConfirmAlertDialog
                isOpen={isBulkCancelConfirmOpen}
                onOpenChange={setIsBulkCancelConfirmOpen}
                title={`Annuler ${selectedReturns.size} retours ?`}
                description="Cette opération est définitive. Le stock et les avoirs seront réversés."
                onConfirm={handleBulkCancel}
                confirmText="Confirmer l'Annulation"
            />
        </div>
    );
}
