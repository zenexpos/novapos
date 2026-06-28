'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { formatDateToYYYYMMDD, cn } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BreadStats } from '@/components/bread/BreadStats';
import { BreadOrderTable } from '@/components/bread/BreadOrderTable';
import { BreadOrderForm } from '@/components/bread/BreadOrderForm';
import { BreadClientList } from '@/components/bread/BreadClientList';
import { BreadOrderCard } from '@/components/bread/BreadOrderCard';
import { PrintBreadListDialog } from '@/components/bread/PrintBreadListDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Loader2, 
    ChevronLeft, 
    ChevronRight, 
    Plus,
    Search,
    Users,
    Calendar,
    Filter,
    LayoutGrid,
    List,
    X,
    CheckCircle2
} from 'lucide-react';
import { breadService } from '@/services/bread.service';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from '@/stores/appStore';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { EmptyState } from '@/components/ui/EmptyState';

export default function BreadPage() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    
    const viewMode = useAppStore(state => state.breadViewMode);
    const setViewMode = useAppStore(state => state.actions.setBreadViewMode);
    
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'delivered' | 'pending'>('all');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAutoBillingConfirmOpen, setIsAutoBillingConfirmOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('distribution');

    const formattedDate = formatDateToYYYYMMDD(currentDate);

    useEffect(() => {
        breadService.ensureOrdersForDate(formattedDate);
        setSelectedOrders(new Set());
    }, [formattedDate]);

    const { value: orders, isLoading } = useLiveQuery<BreadOrderWithCustomer[]>(
        () => breadService.getOrdersForDate(formattedDate),
        [formattedDate]
    );

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        let list = orders;

        if (statusFilter !== 'all') {
            list = list.filter(o => o.isPaid === (statusFilter === 'paid'));
        }

        if (deliveryFilter !== 'all') {
            list = list.filter(o => o.isDelivered === (deliveryFilter === 'delivered'));
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(o => 
                o.orderNumber.toLowerCase().includes(q) ||
                (o.customer && `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(q)) ||
                (o.customName && o.customName.toLowerCase().includes(q)) ||
                (o.notes && o.notes.toLowerCase().includes(q))
            );
        }
        return list;
    }, [orders, searchQuery, statusFilter, deliveryFilter]);

    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    }, []);

    const toggleOrderSelection = useCallback((uuid: string) => {
        setSelectedOrders(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });
    }, []);

    const handleBulkDeliver = async () => {
        if (selectedOrders.size === 0) return;
        setIsProcessing(true);
        try {
            await breadService.bulkUpdateDeliveryStatus(Array.from(selectedOrders), true);
            toast.success(`${selectedOrders.size} commandes marquées comme livrées.`);
            setSelectedOrders(new Set());
        } catch (e) {
            toast.error("Échec de la mise à jour groupée.");
        } finally {
            setIsProcessing(false);
        }
    };

    const runAutomatedTask = async () => {
        setIsProcessing(true);
        try {
            const count = await breadService.processEndOfDayTransfers();
            if (count > 0) toast.success(`${count} ordres transférés au compte.`);
            else toast.info("Aucun ordre à transférer.");
        } catch (e) {
            toast.error("Erreur lors de l'auto-facturation.");
        } finally {
            setIsProcessing(false);
            setIsAutoBillingConfirmOpen(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'ArrowLeft', action: () => handleDateChange(-1), description: 'Jour précédent', ignoreInputFocus: true },
        { key: 'ArrowRight', action: () => handleDateChange(1), description: 'Jour suivant', ignoreInputFocus: true },
        { key: 'n', action: () => setIsFormOpen(true), description: 'Nouvelle commande [N]', ignoreInputFocus: false }
    ], 'LogistiquePain');

    const isFiltered = searchQuery !== '' || statusFilter !== 'all' || deliveryFilter !== 'all';

    return (
        <div className="p-6 space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-700">
            <PageHeader 
                title="Logistique Pain Elite"
                description={format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            >
                <div className="flex items-center gap-3">
                    <PrintBreadListDialog orders={filteredOrders} currentDate={formattedDate} />
                    
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAutoBillingConfirmOpen(true)}
                        disabled={isProcessing}
                        className="rounded-xl border-amber-500/20 bg-amber-500/5 text-amber-600 gap-2 hover:bg-amber-500/10"
                    >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                        Auto-Facturation
                    </Button>

                    <div className="flex gap-1 bg-black/20 p-1 rounded-2xl border border-white/5">
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(-1)} className="rounded-xl h-9 w-9" aria-label="Jour précédent">
                            <ChevronLeft className="h-5 w-5 text-primary" />
                        </Button>
                        <Button 
                            variant={formattedDate === formatDateToYYYYMMDD(new Date()) ? "secondary" : "ghost"} 
                            onClick={() => setCurrentDate(new Date())} 
                            className="rounded-xl h-9 px-4 text-[10px] uppercase font-bold"
                        >
                            Aujourd'hui
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)} className="rounded-xl h-9 w-9" aria-label="Jour suivant">
                            <ChevronRight className="h-5 w-5 text-primary" />
                        </Button>
                    </div>
                    
                    <Button onClick={() => setIsFormOpen(true)} className="rounded-2xl h-10 font-bold shadow-lg gap-2">
                        <Plus className="h-4 w-4" /> Nouvelle [N]
                    </Button>
                </div>
            </PageHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <TabsList className="bg-card/40 border border-white/5 p-1 h-12 rounded-2xl">
                        <TabsTrigger value="distribution" className="rounded-xl px-8 font-bold text-xs uppercase">
                            <Calendar className="h-4 w-4 mr-2" /> Distribution
                        </TabsTrigger>
                        <TabsTrigger value="subscribers" className="rounded-xl px-8 font-bold text-xs uppercase">
                            <Users className="h-4 w-4 mr-2" /> Abonnés Premium
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === 'distribution' && (
                        <div className="flex gap-3 flex-grow max-w-4xl">
                            <div className="relative flex-grow group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Rechercher (Nom, N°, Note)..."
                                    className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/20 hover:text-destructive transition-colors" aria-label="Effacer recherche">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className={cn("h-11 rounded-xl gap-2", isFiltered && "bg-primary/10 border-primary/20")}>
                                        <Filter className="h-4 w-4 opacity-40" />
                                        Filtres
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="rounded-xl w-64 p-2">
                                    <DropdownMenuLabel className="text-[10px] uppercase font-bold px-2 py-1">Statut Paiement</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                                        <DropdownMenuRadioItem value="all" className="text-xs font-bold">Tous</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="paid" className="text-xs font-bold text-emerald-500">Réglés</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="unpaid" className="text-xs font-bold text-orange-500">Non Réglés</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-[10px] uppercase font-bold px-2 py-1">État Livraison</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={deliveryFilter} onValueChange={(v: any) => setDeliveryFilter(v)}>
                                        <DropdownMenuRadioItem value="all" className="text-xs font-bold">Tous</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="delivered" className="text-xs font-bold text-emerald-500">Livrés</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="pending" className="text-xs font-bold text-amber-500">En attente</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
                                <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('grid')} title="Vue Grille"><LayoutGrid className="h-4 w-4"/></Button>
                                <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('list')} title="Vue Liste"><List className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    )}
                </div>

                <TabsContent value="distribution" className="space-y-6 outline-none">
                    <BreadStats date={formattedDate} />
                    
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-20">
                           {[...Array(8)].map((_, i) => <div key={i} className="h-48 bg-card rounded-2xl animate-pulse border border-white/5" />)}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <EmptyState 
                            icon={Search} 
                            title="Aucune distribution" 
                            description={isFiltered ? "Aucun ordre ne correspond à vos filtres." : "Aucune commande enregistrée pour cette date."} 
                        />
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            {viewMode === 'list' ? (
                                <div className="bg-card/40 rounded-lg border border-white/5 overflow-hidden">
                                    <BreadOrderTable orders={filteredOrders} selectedOrders={selectedOrders} onToggleSelection={toggleOrderSelection} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                    {filteredOrders.map(o => (
                                        <BreadOrderCard 
                                            key={o.uuid} 
                                            order={o} 
                                            isSelected={selectedOrders.has(o.uuid)} 
                                            onToggleSelection={() => toggleOrderSelection(o.uuid)} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="subscribers" className="outline-none">
                    <BreadClientList onListChange={() => {}} />
                </TabsContent>
            </Tabs>

            {selectedOrders.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-2xl rounded-full px-8 py-4 flex items-center gap-6">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black">{selectedOrders.size}</div>
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sélections</span>
                        </div>
                        <Button 
                            onClick={handleBulkDeliver}
                            disabled={isProcessing}
                            className="h-12 px-8 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl gap-3"
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Marquer comme Livrés
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedOrders(new Set())} className="h-10 w-10 rounded-full hover:bg-white/10" aria-label="Tout déselectionner">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <BreadOrderForm 
                isOpen={isFormOpen} 
                onOpenChange={setIsFormOpen} 
                currentDate={formattedDate}
                onSuccess={() => {}}
            />

            <ConfirmAlertDialog
                isOpen={isAutoBillingConfirmOpen}
                onOpenChange={setIsAutoBillingConfirmOpen}
                title="Lancer l'Auto-Facturation ?"
                description={
                    <div className="space-y-4">
                        <p>Cette opération va transformer tous les ordres non facturés des jours précédents en dettes clients réelles.</p>
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-amber-700">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            <p className="text-xs font-bold uppercase">Action irréversible sur les soldes comptables.</p>
                        </div>
                    </div>
                }
                onConfirm={runAutomatedTask}
                confirmText="Confirmer le transfert"
            />
        </div>
    );
}
