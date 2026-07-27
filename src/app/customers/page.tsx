'use client';

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
import { exportService } from '@/services/shared/export.service';
import { ImportPreviewDialog } from '@/components/customers/import-preview-dialog';
import { useAppStore } from '@/stores/appStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { formatDate } from '@/lib/utils';

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
        
        const exportData = data.map(c => ({
            'Prénom': c.firstName,
            'Nom': c.lastName,
            'Téléphone': c.phone || '',
            'Adresse': c.address || '',
            'Solde Initial (DA)': c.initialBalance,
            'Total Flux (DA)': c.totalSpent,
            'Solde Net Dû (DA)': c.outstandingBalance,
            'Membre Pain': c.isBreadClient ? 'Oui' : 'Non',
            'Enregistré le': formatDate(c.createdAt)
        }));

        exportService.exportToCsv(`registre-clients-${new Date().toISOString().split('T')[0]}`, exportData);
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
        <div className="p-4 sm:p-6 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-500 pb-24">
            <PageHeader title="Gestion des Clients" description="Suivi des dettes et flux financiers.">
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild disabled={isAnalyzing} className="rounded-lg font-bold">
                        <label className="cursor-pointer flex items-center">
                            {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                            Importer
                            <input type="file" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                        </label>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportCsv} className="rounded-lg font-bold"><FileDown className="mr-2 h-4 w-4" /> Exporter</Button>
                    <Button size="sm" onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }} className="rounded-lg font-bold shadow-sm"><Plus className="mr-2 h-4 w-4" /> Nouveau [N]</Button>
                </div>
            </PageHeader>

            <CustomerStats />

            <div className="flex flex-col lg:flex-row gap-2 bg-muted/20 p-1.5 rounded-xl border">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                    <Input ref={searchInputRef} placeholder="Rechercher... [F3]" className="pl-9 h-9 border-none bg-transparent shadow-none font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex gap-2 px-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="rounded-lg h-9 bg-background border-none font-bold text-xs uppercase">{sortOptions[sortBy]}</Button></DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([k, v]) => <DropdownMenuRadioItem key={k} value={k} className="text-xs font-bold uppercase">{v}</DropdownMenuRadioItem>)}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex bg-muted/40 p-1 rounded-lg border">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-md h-7 w-7" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-md h-7 w-7" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                    </div>
                    {isFiltered && <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive" onClick={resetFilters}><FilterX className="h-4 w-4" /></Button>}
                </div>
            </div>

            <div className="min-h-[450px]">
               {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <Card key={i} className="rounded-2xl border-none animate-pulse h-40 bg-muted/20" />)}
                    </div>
               ) : !customers?.length ? (
                    <EmptyState 
                        icon={Users} 
                        title="Aucun client" 
                        description={isFiltered ? "Ajustez les filtres." : "Commencez par ajouter un client."} 
                        actionLabel="Nouveau Client"
                        onAction={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}
                    />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {customers.map(c => <CustomerCard key={c.uuid} customer={c} onEdit={handleEditCustomer} onDelete={handleDeleteCustomer} isSelected={selectedCustomers.has(c.uuid)} onToggleSelection={() => { const n = new Set(selectedCustomers); if (n.has(c.uuid)) n.delete(c.uuid); else n.add(c.uuid); setSelectedCustomers(n); }} isSelectionActive={selectedCustomers.size > 0} />)}
                    </div>
               )}
            </div>

            {selectedCustomers.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10">
                    <div className="bg-card/90 backdrop-blur-md border border-primary/20 shadow-xl rounded-full px-6 py-3 flex items-center gap-6">
                        <span className="text-[10px] font-black uppercase text-primary">{selectedCustomers.size} sélectionnés</span>
                        <div className="h-4 w-px bg-border" />
                        <div className="flex items-center gap-4">
                            <button onClick={handleExportCsv} className="text-[9px] font-black uppercase hover:text-primary transition-colors">Exporter</button>
                            <button onClick={() => setIsBulkDeleteDialogOpen(true)} className="text-[9px] font-black uppercase text-destructive hover:opacity-80 transition-colors">Supprimer</button>
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
