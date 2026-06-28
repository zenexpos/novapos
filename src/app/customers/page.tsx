'use client';
import React from 'react';

import { useState, useCallback, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedAbortSignal } from '@/hooks/useDebounce';
import type { Customer, ImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, FileUp, Loader2, FileDown, FilterX, Trash2, LayoutGrid, List } from 'lucide-react';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { DeleteMultipleCustomersDialog } from '@/components/customers/DeleteMultipleCustomersDialog';
import { toast } from 'sonner';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/card';
import { customerService } from '@/services/customer.service';
import { ImportPreviewDialog } from '@/components/customers/import-preview-dialog';
import Papa from 'papaparse';
import { useAppStore } from '@/stores/appStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLiveQuery } from '@/hooks/useLiveQuery';

type FilterStatus = 'all' | 'has_debt' | 'overdue' | 'over_limit' | 'is_bread_client';

const sortOptions: { [key: string]: string } = {
    'createdAt_desc': 'Plus récents',
    'searchName_asc': 'Nom (A-Z)',
    'totalSpent_desc': 'Plus dépensier',
    'outstandingBalance_desc': 'Plus endetté',
};

function CustomersContent() {
    const searchParams = useSearchParams();
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    const viewMode = useAppStore(state => state.customersViewMode);
    const setViewMode = useAppStore(state => state.actions.setCustomersViewMode);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortBy, setSortBy] = useState('createdAt_desc');
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
    
    const { debouncedValue } = useDebouncedAbortSignal(searchQuery, 300);

    const customersResult = useLiveQuery<Customer[]>(
        () => customerService.filterCustomers({ query: debouncedValue, status: filterStatus, sortBy }),
        [debouncedValue, filterStatus, sortBy]
    );
    const customers = customersResult.value;
    const isLoading = customersResult.isLoading;

    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        const s = searchParams.get('status') as FilterStatus;
        if (s && ['all', 'has_debt', 'overdue', 'over_limit', 'is_bread_client'].includes(s)) setFilterStatus(s);
    }, [searchParams]);

    useEffect(() => { setSelectedCustomers(new Set()); }, [filterStatus, sortBy, debouncedValue]);

    const handleEditCustomer = useCallback((c: Customer) => { 
        setSelectedCustomer(c); 
        setIsCustomerDialogOpen(true); 
    }, []);

    const handleDeleteCustomer = useCallback((c: Customer) => { 
        setSelectedCustomer(c); 
        setIsDeleteDialogOpen(true); 
    }, []);

    const handleConfirmDeleteCustomer = async () => {
        if (!selectedCustomer) return;
        try {
            await customerService.deleteCustomer(selectedCustomer.uuid);
            setIsDeleteDialogOpen(false);
            setSelectedCustomer(null);
            customersResult.refresh();
            toast.success('Client supprimé.');
        } catch (e: any) {
            toast.error(e?.message || 'Erreur suppression');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await customerService.bulkDelete(Array.from(selectedCustomers));
            setIsBulkDeleteDialogOpen(false);
            setSelectedCustomers(new Set());
            customersResult.refresh();
            toast.success(`${selectedCustomers.size} clients supprimés.`);
        } catch (e: any) {
            toast.error(e.message || "Erreur lors de la suppression groupée.");
        }
    };

    const handleExportCsv = () => {
        if (!customers?.length) return;
        const data = selectedCustomers.size > 0 ? customers.filter(c => selectedCustomers.has(c.uuid)) : customers;
        const csv = Papa.unparse(data.map(c => ({ Prénom: c.firstName, Nom: c.lastName, Téléphone: c.phone || '', Total: c.totalSpent, Solde: c.outstandingBalance })));
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success("Registre exporté avec succès.");
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAnalyzing(true);
        try {
            const analysis = await customerService.analyzeImport(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur d'analyse CSV");
        } finally {
            setIsAnalyzing(false);
            e.target.value = ''; 
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await customerService.executeImport(confirmedData);
            toast.success("Importation réussie.");
            setIsImportPreviewOpen(false);
            customersResult.refresh();
        } catch (error: any) {
            toast.error("Échec de l'importation.");
        } finally {
            setIsImporting(false);
        }
    };

    const resetFilters = () => { setSearchQuery(''); setFilterStatus('all'); setSortBy('createdAt_desc'); };

    useKeyboardShortcuts([
        { key: 'F3', action: () => searchInputRef.current?.focus(), description: 'Chercher', ignoreInputFocus: true }, 
        { key: 'n', action: () => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }, description: 'Nouveau', ignoreInputFocus: false }
    ], 'Clients');

    const isFiltered = searchQuery !== '' || filterStatus !== 'all' || sortBy !== 'createdAt_desc';
    
    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-700 pb-24">
            <PageHeader title="Gestion des Clients" description="Suivi des dettes et flux financiers.">
                <div className="flex gap-2">
                    <Button variant="outline" asChild disabled={isAnalyzing} className="rounded-xl font-bold border-primary/20">
                        <label className="cursor-pointer flex items-center">
                            {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                            Importer
                            <input type="file" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                        </label>
                    </Button>
                    <Button variant="outline" onClick={handleExportCsv} className="rounded-xl font-bold border-primary/20"><FileDown className="mr-2 h-4 w-4" /> Exporter</Button>
                    <Button onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }} className="rounded-xl font-bold shadow-lg"><Plus className="mr-2 h-4 w-4" /> Nouveau [N]</Button>
                </div>
            </PageHeader>

            <CustomerStats />

            <div className="flex flex-col lg:flex-row gap-3 bg-card/20 p-2 rounded-2xl border border-white/5 backdrop-blur-sm shadow-inner">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input ref={searchInputRef} placeholder="Rechercher... [F3]" className="pl-11 h-11 rounded-xl bg-black/20 border-none shadow-sm font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex gap-2 px-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" className="rounded-xl h-11 bg-black/20 border-none font-bold text-xs uppercase">{sortOptions[sortBy]}</Button></DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-none shadow-xl">
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([k, v]) => <DropdownMenuRadioItem key={k} value={k} className="text-xs font-bold uppercase">{v}</DropdownMenuRadioItem>)}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                    </div>
                    {isFiltered && <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10" onClick={resetFilters}><FilterX className="h-4 w-4" /></Button>}
                </div>
            </div>

            <div className="min-h-[450px]">
               {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => <Card key={i} className="rounded-3xl border-none animate-pulse h-48 bg-card/40" />)}
                    </div>
               ) : !customers?.length ? (
                    <EmptyState icon={Users} title="Aucun client" description={isFiltered ? "Ajustez les filtres." : "Ajoutez un client pour commencer le suivi."} />
               ) : viewMode === 'list' ? (
                    <CustomerTable 
                        customers={customers} 
                        onEdit={handleEditCustomer} 
                        onDelete={handleDeleteCustomer} 
                        selectedCustomers={selectedCustomers} 
                        onToggleSelection={u => setSelectedCustomers(p => { const n = new Set(p); if (n.has(u)) n.delete(u); else n.add(u); return n; })} 
                        onToggleSelectAll={() => setSelectedCustomers(p => p.size === customers.length ? new Set() : new Set(customers.map(c => c.uuid)))} 
                    />
               ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {customers.map(c => <CustomerCard key={c.uuid} customer={c} onEdit={handleEditCustomer} onDelete={handleDeleteCustomer} isSelected={selectedCustomers.has(c.uuid)} onToggleSelection={() => { const n = new Set(selectedCustomers); if (n.has(c.uuid)) n.delete(c.uuid); else n.add(c.uuid); setSelectedCustomers(n); }} isSelectionActive={selectedCustomers.size > 0} />)}
                    </div>
               )}
            </div>

            {selectedCustomers.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-2xl rounded-full px-8 py-4 flex items-center gap-6">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black">{selectedCustomers.size}</div>
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sélections</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <Button variant="ghost" onClick={handleExportCsv} className="h-12 px-6 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 transition-all">
                                <FileDown className="mr-2 h-4 w-4" /> Exporter (.csv)
                            </Button>
                            <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(true)} className="h-12 px-6 rounded-full font-black text-[10px] uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all">
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <CustomerDialog isOpen={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen} customer={selectedCustomer} onSuccess={() => customersResult.refresh()} />
            <DeleteCustomerDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} name={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : ''} onConfirm={handleConfirmDeleteCustomer} />
            <DeleteMultipleCustomersDialog isOpen={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen} count={selectedCustomers.size} onConfirm={handleBulkDelete} />
            <ImportPreviewDialog isOpen={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen} analysis={importAnalysis} onConfirm={handleConfirmImport} isImporting={isImporting} />
        </div>
    );
}

export default function CustomersPage() {
    return <Suspense fallback={null}><CustomersContent /></Suspense>;
}
