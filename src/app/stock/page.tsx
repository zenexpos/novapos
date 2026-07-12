'use client';

import { useState, useMemo, useRef } from 'react';
import type { StockIntake, Supplier, InventoryLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Archive, LayoutGrid, List, History, ArrowUpDown, RefreshCw, Building, Wallet, UserPlus, Trash2, X, FileUp } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { StockIntakeCard } from '@/components/stock/stock-intake-card';
import { StockIntakeTable } from '@/components/stock/stock-intake-table';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

/**
 * iPOS Stock & Logistics Hub.
 * Advanced inventory management with audited movements.
 */
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

    const suppliersResult = useLiveQuery<Supplier[]>(async () => {
        const arr = await db.suppliers.filter(s => !s.deletedAt).toArray();
        return arr.sort((a, b) => a.name.localeCompare(b.name));
    }, []);
    const suppliers = suppliersResult.value ?? (EMPTY_ARRAY as Supplier[]);
    
    const stockIntakesResult = useLiveQuery<StockIntake[]>(async () => {
        if (!isMounted || !dateRange?.from) return EMPTY_ARRAY as StockIntake[];
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to || new Date());
        
        const results = await db.stock_intakes.where('createdAt').between(start, end, true, true).toArray();
        
        let filtered = results;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchingSupplierUuids = suppliers
                .filter(s => s.name.toLowerCase().includes(q))
                .map(s => s.uuid);

            filtered = results.filter(i => 
                (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(q)) ||
                (i.supplierUuid && matchingSupplierUuids.includes(i.supplierUuid))
            );
        }

        return filtered.sort((a,b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    }, [isMounted, dateRange, searchQuery, suppliers]);
    const stockIntakes = stockIntakesResult.value ?? (EMPTY_ARRAY as StockIntake[]);

    const inventoryLogsResult = useLiveQuery<InventoryLog[]>(async () => {
        if (!isMounted || !dateRange?.from) return EMPTY_ARRAY as InventoryLog[];
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to || new Date());
        
        const logs = await db.inventory_logs
            .where('createdAt')
            .between(start, end, true, true)
            .reverse()
            .limit(150)
            .toArray();

        const productUuids = Array.from(new Set(logs.map(l => l.productUuid).filter((uuid): uuid is string => uuid !== null)));
        const products = productUuids.length > 0
            ? await db.products.where('uuid').anyOf(productUuids).toArray()
            : [];
        const productMap = new Map(products.map(p => [p.uuid, p.name]));

        const result = logs.map(l => ({
            ...l,
            productName: productMap.get(l.productUuid ?? '') || 'Produit inconnu'
        }));

        if (!searchQuery.trim()) return result;
        const q = searchQuery.toLowerCase();
        return result.filter(l => l.productName.toLowerCase().includes(q));
    }, [isMounted, dateRange, searchQuery]);
    const inventoryLogs = inventoryLogsResult.value ?? (EMPTY_ARRAY as InventoryLog[]);

    const filteredSuppliers = useMemo(() => {
        if (!suppliers) return [];
        if (!searchQuery.trim()) return suppliers;
        const q = searchQuery.toLowerCase();
        return suppliers.filter(s => s.name.toLowerCase().includes(q) || s.phone?.includes(q));
    }, [suppliers, searchQuery]);

    const supplierMap = useMemo(() => new Map((suppliers || []).map(s => [s.uuid, s])), [suppliers]);

    const isLoading = suppliersResult.isLoading || (activeTab === 'intakes' && stockIntakesResult.isLoading);

    const totalSuppliersDebt = useMemo(() => {
        if (!suppliers) return 0;
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
        if (!suppliers) return;
        if (selectedSuppliers.size === suppliers.length) {
            setSelectedSuppliers(new Set());
        } else {
            setSelectedSuppliers(new Set(suppliers.map(s => s.uuid)));
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
            toast.error("Échec de la suppression groupée (Vérifiez factures et paiements).");
        }
    };

    const handleExportSuppliers = () => {
        if (!suppliers) return;
        const toExport = selectedSuppliers.size > 0 
            ? suppliers.filter(s => selectedSuppliers.has(s.uuid))
            : suppliers;

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

    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000 pb-20">
            <PageHeader
                title="Elite Logistics Hub"
                description="Audit des flux entrants & Management des partenaires"
                icon={Archive}
            >
                <div className="flex gap-3 w-full sm:w-auto">
                    {activeTab === 'suppliers' ? (
                        <Button onClick={handleAddSupplier} className="flex-1 sm:flex-none h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl gap-3">
                            <UserPlus className="h-4 w-4" /> Nouveau Partenaire [N]
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setIsAdjustmentOpen(true)} className="flex-1 sm:flex-none h-12 rounded-2xl font-black text-xs uppercase tracking-widest border-primary/20 bg-card hover:bg-primary/5 transition-all gap-3 px-6">
                                <ArrowUpDown className="h-4 w-4 text-primary" /> Correction Stock
                            </Button>
                            <Button asChild className="flex-1 sm:flex-none h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl gap-3">
                                <Link href="/stock/intake">
                                    <Plus className="h-4 w-4" /> Réception [N]
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <div className="animate-in slide-in-from-top-4 duration-700">
                {activeTab === 'suppliers' ? (
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="app-card p-6 rounded-lg glass flex items-center justify-between group overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest mb-3">Réseau Partenaires</p>
                                <p className="text-3xl font-black tracking-tighter group-hover:scale-110 transition-transform origin-left">{suppliers.length}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/10 text-primary shadow-inner relative z-10">
                                <Building className="h-8 w-8" />
                            </div>
                            <Building className="absolute -right-6 -bottom-6 h-32 w-32 opacity-[0.02] group-hover:opacity-10 transition-opacity" />
                        </div>
                        <div className="app-card p-6 rounded-lg glass flex items-center justify-between col-span-2 group overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase text-destructive/40 tracking-widest mb-3">Dette Globale Fournisseurs</p>
                                <p className="text-3xl font-black tracking-tighter text-destructive group-hover:scale-105 transition-transform origin-left">{formatCurrency(totalSuppliersDebt)}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-destructive/10 text-destructive shadow-inner relative z-10">
                                <Wallet className="h-8 w-8" />
                            </div>
                            <Wallet className="absolute -right-6 -bottom-6 h-32 w-32 opacity-[0.02] group-hover:opacity-10 transition-opacity" />
                        </div>
                    </div>
                ) : (
                    <StockIntakeStats intakes={stockIntakes} isLoading={isLoading && activeTab === 'intakes'} />
                )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/20 p-2 rounded-lg border border-white/5 backdrop-blur-sm shadow-inner">
                <div className="flex items-center gap-2 p-1.5 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('intakes')}
                        className={cn(
                            "flex items-center gap-3 px-8 py-3 rounded-lg text-[10px] font-black uppercase transition-all duration-500",
                            activeTab === 'intakes' ? "bg-primary text-primary-foreground shadow-sm scale-105" : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Archive className="h-4 w-4" /> Réceptions
                    </button>
                    <button 
                        onClick={() => setActiveTab('suppliers')}
                        className={cn(
                            "flex items-center gap-3 px-8 py-3 rounded-lg text-[10px] font-black uppercase transition-all duration-500",
                            activeTab === 'suppliers' ? "bg-primary text-primary-foreground shadow-sm scale-105" : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Building className="h-4 w-4" /> Fournisseurs
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={cn(
                            "flex items-center gap-3 px-8 py-3 rounded-lg text-[10px] font-black uppercase transition-all duration-500",
                            activeTab === 'logs' ? "bg-primary text-primary-foreground shadow-sm scale-105" : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <History className="h-4 w-4" /> Audit Flux
                    </button>
                </div>

                <div className="flex items-center gap-4 px-4">
                    <div className="relative group flex-grow max-w-xs">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                            ref={searchInputRef}
                            placeholder="Rechercher [F3]..."
                            className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-black text-lg"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={resetFilters} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-destructive transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <DateRangePicker date={dateRange} setDate={setDate} />
                </div>
            </div>

            {activeTab === 'suppliers' && selectedSuppliers.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-sm rounded-full px-8 py-4 flex items-center gap-4">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black shadow-lg">
                                {selectedSuppliers.size}
                            </div>
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sélections</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={handleExportSuppliers} className="rounded-full h-12 px-6 font-black text-[10px] uppercase hover:bg-primary/10 transition-all">
                                <FileUp className="mr-2 h-4 w-4" /> Exporter (.csv)
                            </Button>
                            <Button variant="ghost" onClick={() => setIsBulkDeleteSupplierOpen(true)} className="rounded-full h-12 px-6 font-black text-[10px] uppercase text-destructive hover:bg-destructive/10 transition-all">
                                <Trash2 className="mr-2 h-4 w-4" /> Révoquer Comptes
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSuppliers(new Set())} className="rounded-full h-12 w-12 hover:bg-white/5 transition-all">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-lg bg-card/40 border border-white/5 animate-pulse" />)}
                    </div>
                ) : (
                    <>
                        {activeTab === 'intakes' && (
                            <div className="space-y-4 animate-page-enter">
                                <div className="flex justify-end px-4">
                                    <div className="flex items-center gap-1.5 p-1.5 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                {stockIntakes.length === 0 ? (
                                    <EmptyState 
                                        icon={Archive} 
                                        title="Silence de Réception" 
                                        description={searchQuery ? "Aucune facture correspondante." : "Enregistrez vos factures d'achat pour gérer votre stock."} 
                                        actionLabel="Nouvelle Réception"
                                        onAction={() => router.push('/stock/intake')}
                                    />
                                ) : viewMode === 'list' ? (
                                    <StockIntakeTable intakes={stockIntakes} supplierMap={supplierMap} onViewDetails={handleViewDetails} onCancelIntake={handleCancelIntake} />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {stockIntakes.map(s => (
                                            <StockIntakeCard key={s.uuid} intake={s} supplierName={s.supplierUuid ? supplierMap.get(s.supplierUuid)?.name : undefined} onViewDetails={handleViewDetails} onCancelIntake={handleCancelIntake} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'logs' && (
                            inventoryLogs.length === 0 ? (
                                <EmptyState icon={History} title="Journal Vierge" description="Aucun mouvement de stock détecté." />
                            ) : <InventoryLogTable logs={inventoryLogs as any} />
                        )}
                        {activeTab === 'suppliers' && (
                            filteredSuppliers.length === 0 ? (
                                <EmptyState 
                                    icon={Building} 
                                    title="Carnet Partenaires Vide" 
                                    description="Commencez par ajouter votre premier fournisseur pour gérer vos achats." 
                                    actionLabel="Nouveau Fournisseur"
                                    onAction={handleAddSupplier}
                                />
                            ) : (
                                <SupplierTable 
                                    suppliers={filteredSuppliers} 
                                    onPay={handlePaySupplier} 
                                    onEdit={handleEditSupplier} 
                                    onDelete={handleDeleteSupplier} 
                                    selectedSuppliers={selectedSuppliers}
                                    onToggleSupplierSelection={handleToggleSupplierSelection}
                                    onToggleSelectAll={handleToggleSelectAllSuppliers}
                                />
                            )
                        )}
                    </>
                )}
            </div>

            <StockIntakeDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} intake={selectedIntake} supplierName={selectedIntake?.supplierUuid ? supplierMap.get(selectedIntake.supplierUuid)?.name : 'Partenaire Inconnu'} />
            <CancelIntakeDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} intake={selectedIntake} onSuccess={() => stockIntakesResult.refresh()} />
            <StockAdjustmentDialog isOpen={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen} onSuccess={() => inventoryLogsResult.refresh()} />
            <SupplierPaymentDialog isOpen={isSupplierPayOpen} onOpenChange={setIsSupplierPayOpen} supplier={selectedSupplier} onSuccess={() => suppliersResult.refresh()} />
            <SupplierDialog isOpen={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen} supplier={selectedSupplier} onSuccess={() => suppliersResult.refresh()} />
            
            <ConfirmAlertDialog 
                isOpen={isDeleteSupplierOpen} 
                onOpenChange={setIsDeleteSupplierOpen} 
                title={`Révoquer le partenaire ${selectedSupplier?.name} ?`} 
                description="Cette action est irréversible. Seuls les comptes avec un solde nul et sans historique actif peuvent être supprimés." 
                onConfirm={performDeleteSupplier} 
                confirmText="Confirmer Révocation" 
            />

            <ConfirmAlertDialog
                isOpen={isBulkDeleteSupplierOpen}
                onOpenChange={setIsBulkDeleteSupplierOpen}
                title={`Révoquer ${selectedSuppliers.size} partenaires ?`}
                description="Seuls les comptes avec un solde nul seront supprimés pour garantir l'intégrité des données."
                onConfirm={handleBulkDeleteSuppliers}
                confirmText="Confirmer Révocation Groupée"
            />
        </div>
    );
}
