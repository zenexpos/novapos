'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { StockIntake, Supplier, InventoryLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Search, Plus, Archive, LayoutGrid, List, History, 
    ArrowUpDown, RefreshCw, Building, Wallet, UserPlus, 
    Trash2, X, FileUp 
} from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { StockIntakeCard } from '@/components/stock/stock-intake-card';
import { StockIntakeTable } from '@/components/stock/stock-intake-table';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supplierService } from '@/services/supplier.service';
import { useAppStore } from '@/stores/appStore';
import { CancelIntakeDialog } from '@/components/stock/CancelIntakeDialog';
import { StockIntakeStats } from '@/components/stock/StockIntakeStats';
import { InventoryLogTable } from '@/components/stock/InventoryLogTable';
import { StockAdjustmentDialog } from '@/components/stock/StockAdjustmentDialog';
import { SupplierTable } from '@/components/stock/SupplierTable';
import { SupplierPaymentDialog } from '@/components/stock/SupplierPaymentDialog';
import { SupplierDialog } from '@/components/stock/SupplierDialog';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { cn, formatCurrency, safeNumber } from '@/lib/utils';
import { exportService } from '@/services/shared/export.service';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';
import { EMPTY_ARRAY } from '@/lib/constants';

type StockTab = 'intakes' | 'logs' | 'suppliers';

type EnrichedLog = InventoryLog & { productName: string; reference?: string };

export default function StockPage() {
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    const viewMode = useAppStore(state => state.stockViewMode);
    const setViewMode = useAppStore(state => state.actions.setStockViewMode);

    const [activeTab, setActiveTab] = useState<StockTab>('intakes');
    const [searchQuery, setSearchQuery] = useState('');
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
    
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [isSupplierPayOpen, setIsSupplierPayOpen] = useState(false);
    const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
    const [isDeleteSupplierOpen, setIsDeleteSupplierOpen] = useState(false);
    const [isBulkDeleteSupplierOpen, setIsBulkDeleteSupplierOpen] = useState(false);

    // 1. Suppliers Query
    const suppliersResult = useLiveQuery<Supplier[]>(async () => {
        const arr = await db.suppliers.filter(s => !s.deletedAt).toArray();
        return arr.sort((a, b) => a.name.localeCompare(b.name));
    }, []);
    const suppliers = suppliersResult.value ?? (EMPTY_ARRAY as Supplier[]);
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.uuid, s])), [suppliers]);
    
    // 2. Intakes Query
    const stockIntakesResult = useLiveQuery<StockIntake[]>(async () => {
        if (!isMounted || !dateRange?.from) return EMPTY_ARRAY as StockIntake[];
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to || new Date());
        
        const results = await db.stock_intakes.where('createdAt').between(start, end, true, true).toArray();
        
        if (!searchQuery.trim()) return results.sort((a,b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

        const q = searchQuery.toLowerCase();
        const matchingSupplierUuids = suppliers
            .filter(s => s.name.toLowerCase().includes(q))
            .map(s => s.uuid);

        return results.filter(i => 
            (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(q)) ||
            (i.supplierUuid && matchingSupplierUuids.includes(i.supplierUuid))
        ).sort((a,b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    }, [isMounted, dateRange, searchQuery, suppliers]);
    const stockIntakes = stockIntakesResult.value ?? (EMPTY_ARRAY as StockIntake[]);

    // 3. Inventory Logs Query with Join
    const inventoryLogsResult = useLiveQuery<EnrichedLog[]>(async () => {
        if (!isMounted || !dateRange?.from) return EMPTY_ARRAY as EnrichedLog[];
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to || new Date());
        
        const logs = await db.inventory_logs
            .where('createdAt')
            .between(start, end, true, true)
            .reverse()
            .limit(200)
            .toArray();

        const productUuids = Array.from(new Set(logs.map(l => l.productUuid).filter((uuid): uuid is string => !!uuid)));
        const products = productUuids.length > 0
            ? await db.products.where('uuid').anyOf(productUuids).toArray()
            : [];
        const productMap = new Map(products.map(p => [p.uuid, p.name]));

        const result: EnrichedLog[] = logs.map(l => ({
            ...l,
            productName: productMap.get(l.productUuid ?? '') || 'Produit inconnu'
        }));

        if (!searchQuery.trim()) return result;
        const q = searchQuery.toLowerCase();
        return result.filter(l => l.productName.toLowerCase().includes(q) || (l.details && l.details.toLowerCase().includes(q)));
    }, [isMounted, dateRange, searchQuery]);
    const inventoryLogs = inventoryLogsResult.value ?? (EMPTY_ARRAY as EnrichedLog[]);

    const filteredSuppliers = useMemo(() => {
        if (!searchQuery.trim()) return suppliers;
        const q = searchQuery.toLowerCase();
        return suppliers.filter(s => s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q)));
    }, [suppliers, searchQuery]);

    const totalSuppliersDebt = useMemo(() => {
        return suppliers.reduce((sum, s) => sum + Math.round(safeNumber(s.balance) * 100), 0) / 100;
    }, [suppliers]);

    const handleViewDetails = (intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsDetailsOpen(true);
    };

    const handleCancelIntake = (intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsCancelOpen(true);
    };

    const handlePaySupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsSupplierPayOpen(true);
    };

    const handleEditSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsSupplierDialogOpen(true);
    };

    const handleAddSupplier = () => {
        setSelectedSupplier(null);
        setIsSupplierDialogOpen(true);
    };

    const handleDeleteSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsDeleteSupplierOpen(true);
    };

    const performDeleteSupplier = async () => {
        if (selectedSupplier) {
            try {
                await supplierService.deleteSupplier(selectedSupplier.uuid);
                toast.success(`Fournisseur "${selectedSupplier.name}" révoqué.`);
                setIsDeleteSupplierOpen(false);
                suppliersResult.refresh();
            } catch (e: any) {
                toast.error(e.message);
            }
        }
    };

    const handleToggleSupplierSelection = (uuid: string) => {
        setSelectedSuppliers(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });
    };

    const handleToggleSelectAllSuppliers = () => {
        if (selectedSuppliers.size === filteredSuppliers.length) {
            setSelectedSuppliers(new Set());
        } else {
            setSelectedSuppliers(new Set(filteredSuppliers.map(s => s.uuid)));
        }
    };

    const handleBulkDeleteSuppliers = async () => {
        const uuids = Array.from(selectedSuppliers);
        try {
            await supplierService.bulkDelete(uuids);
            toast.success(`${uuids.length} fournisseur(s) supprimé(s).`);
            setSelectedSuppliers(new Set());
            suppliersResult.refresh();
        } catch (e: any) {
            toast.error("Échec de la suppression groupée (Solde ou historique actif).");
        }
    };

    const handleExportSuppliers = () => {
        const toExport = selectedSuppliers.size > 0 
            ? filteredSuppliers.filter(s => selectedSuppliers.has(s.uuid))
            : filteredSuppliers;

        const data = toExport.map(s => ({
            'Nom': s.name,
            'Contact': s.contactPerson || '',
            'Téléphone': s.phone || '',
            'Email': s.email || '',
            'Adresse': s.address || '',
            'Solde Dû (DA)': s.balance
        }));

        exportService.exportToCsv(`liste-fournisseurs-${new Date().toISOString().split('T')[0]}`, data);
    };

    const resetFilters = () => setSearchQuery('');

    useKeyboardShortcuts([
        { key: 'F3', action: () => searchInputRef.current?.focus(), description: 'Rechercher', ignoreInputFocus: true },
        { key: 'n', action: () => activeTab === 'suppliers' ? handleAddSupplier() : router.push('/stock/intake'), description: 'Nouvel élément', ignoreInputFocus: false }
    ], 'Logistique');

    const isLoading = suppliersResult.isLoading || (activeTab === 'intakes' && stockIntakesResult.isLoading);

    return (
        <div className="p-4 sm:p-6 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-500 pb-24">
            <PageHeader
                title="Elite Logistics Hub"
                description="Audit des flux entrants & Management des partenaires"
                icon={Archive}
                className="mb-4"
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    {activeTab === 'suppliers' ? (
                        <Button size="sm" onClick={handleAddSupplier} className="h-9 px-6 rounded-lg shadow-sm">
                            <UserPlus className="h-4 w-4 mr-1.5" /> Nouveau [N]
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setIsAdjustmentOpen(true)} className="h-9 px-3 rounded-lg border-primary/20 bg-primary/5 hover:bg-primary/10">
                                <ArrowUpDown className="h-4 w-4 mr-1 text-primary" /> Correction
                            </Button>
                            <Button size="sm" asChild className="h-9 px-6 rounded-lg shadow-sm">
                                <Link href="/stock/intake">
                                    <Plus className="h-4 w-4 mr-1.5" /> Réception [N]
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <div className="animate-in slide-in-from-top-2 duration-500">
                {activeTab === 'suppliers' ? (
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="app-card p-4 rounded-xl glass flex items-center justify-between border-none shadow-sm">
                            <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">Réseau Partenaires</p>
                                <p className="text-xl font-black tracking-tighter">{suppliers.length}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Building className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="app-card p-4 rounded-xl glass flex items-center justify-between col-span-2 border-none shadow-sm">
                            <div>
                                <p className="text-[9px] font-black uppercase text-destructive/40 tracking-widest mb-1">Dette Globale Fournisseurs</p>
                                <p className="text-xl font-black tracking-tighter text-destructive">{formatCurrency(totalSuppliersDebt)}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                                <Wallet className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <StockIntakeStats intakes={stockIntakes} isLoading={isLoading && activeTab === 'intakes'} />
                )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 bg-muted/20 p-1.5 rounded-xl border">
                <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg border">
                    {(['intakes', 'suppliers', 'logs'] as StockTab[]).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all",
                                activeTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground"
                            )}
                        >
                            {tab === 'intakes' ? 'Réceptions' : tab === 'suppliers' ? 'Fournisseurs' : 'Audit Flux'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 px-1 flex-grow lg:flex-grow-0">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                        <Input 
                            ref={searchInputRef}
                            placeholder="Rechercher... [F3]"
                            className="pl-9 h-9 border-none bg-transparent shadow-none font-bold text-xs"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <DateRangePicker date={dateRange} setDate={setDate} className="h-9" />
                    <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg border">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-md h-7 w-7" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-md h-7 w-7" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                    </div>
                </div>
            </div>

            {activeTab === 'suppliers' && selectedSuppliers.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10">
                    <div className="bg-card/90 backdrop-blur-md border border-primary/20 shadow-xl rounded-full px-6 py-3 flex items-center gap-6">
                        <span className="text-[10px] font-black uppercase text-primary">{selectedSuppliers.size} sélectionnés</span>
                        <div className="h-4 w-px bg-border" />
                        <div className="flex items-center gap-4">
                            <button onClick={handleExportSuppliers} className="text-[9px] font-black uppercase hover:text-primary transition-colors">Exporter</button>
                            <button onClick={() => setIsBulkDeleteSupplierOpen(true)} className="text-[9px] font-black uppercase text-destructive hover:opacity-80 transition-colors">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl bg-muted/20 border-none animate-pulse" />)}
                    </div>
                ) : (
                    <>
                        {activeTab === 'intakes' && (
                            stockIntakes.length === 0 ? (
                                <EmptyState icon={Archive} title="Aucune réception" description={searchQuery ? "Ajustez vos filtres." : "Enregistrez vos factures d'achat."} actionLabel="Nouvelle Réception" onAction={() => router.push('/stock/intake')} />
                            ) : viewMode === 'list' ? (
                                <StockIntakeTable intakes={stockIntakes} supplierMap={supplierMap} onViewDetails={handleViewDetails} onCancelIntake={handleCancelIntake} />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {stockIntakes.map(s => (
                                        <StockIntakeCard key={s.uuid} intake={s} supplierName={s.supplierUuid ? supplierMap.get(s.supplierUuid)?.name : undefined} onViewDetails={handleViewDetails} onCancelIntake={handleCancelIntake} />
                                    ))}
                                </div>
                            )
                        )}
                        {activeTab === 'logs' && (
                            inventoryLogs.length === 0 ? (
                                <EmptyState icon={History} title="Aucun mouvement" description="Aucune transaction de stock détectée." />
                            ) : <InventoryLogTable logs={inventoryLogs} />
                        )}
                        {activeTab === 'suppliers' && (
                            filteredSuppliers.length === 0 ? (
                                <EmptyState icon={Building} title="Carnet vide" description="Commencez par ajouter un fournisseur." actionLabel="Nouveau Fournisseur" onAction={handleAddSupplier} />
                            ) : (
                                <SupplierTable suppliers={filteredSuppliers} onPay={handlePaySupplier} onEdit={handleEditSupplier} onDelete={handleDeleteSupplier} selectedSuppliers={selectedSuppliers} onToggleSupplierSelection={handleToggleSupplierSelection} onToggleSelectAll={handleToggleSelectAllSuppliers} />
                            )
                        )}
                    </>
                )}
            </div>

            <StockIntakeDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} intake={selectedIntake} supplierName={selectedIntake?.supplierUuid ? supplierMap.get(selectedIntake.supplierUuid)?.name : 'Passage'} />
            <CancelIntakeDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} intake={selectedIntake} onSuccess={() => stockIntakesResult.refresh()} />
            <StockAdjustmentDialog isOpen={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen} onSuccess={() => inventoryLogsResult.refresh()} />
            <SupplierPaymentDialog isOpen={isSupplierPayOpen} onOpenChange={setIsSupplierPayOpen} supplier={selectedSupplier} onSuccess={() => suppliersResult.refresh()} />
            <SupplierDialog isOpen={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen} supplier={selectedSupplier} onSuccess={() => suppliersResult.refresh()} />
            
            <ConfirmAlertDialog isOpen={isDeleteSupplierOpen} onOpenChange={setIsDeleteSupplierOpen} title="Révoquer le partenaire ?" description="Seuls les comptes avec un solde nul peuvent être supprimés." onConfirm={performDeleteSupplier} confirmText="Révoquer" />
            <ConfirmAlertDialog isOpen={isBulkDeleteSupplierOpen} onOpenChange={setIsBulkDeleteSupplierOpen} title="Supprimer la sélection ?" description="Seuls les comptes مع رصيد صفر سيتم حذفهم." onConfirm={handleBulkDeleteSuppliers} confirmText="Supprimer" />
        </div>
    );
}
