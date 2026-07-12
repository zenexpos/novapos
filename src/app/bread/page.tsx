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
    Calendar,
    LayoutGrid,
    List,
    Info,
    RefreshCw,
    Filter,
    X,
    FilterX
} from 'lucide-react';
import { breadService } from '@/services/bread.service';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/appStore';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DeliveryFilter = 'all' | 'delivered' | 'pending';
type PaymentFilter = 'all' | 'paid' | 'unpaid';

export default function BreadPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    
    // Advanced UI Filters
    const [filterDelivery, setFilterDelivery] = useState<DeliveryFilter>('all');
    const [filterPayment, setFilterPayment] = useState<PaymentFilter>('all');
    
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    
    const viewMode = useAppStore(state => state.breadViewMode);
    const setViewMode = useAppStore(state => state.actions.setBreadViewMode);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAutoBillingConfirmOpen, setIsAutoBillingConfirmOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('distribution');

    const formattedDate = useMemo(() => isMounted ? formatDateToYYYYMMDD(currentDate) : '', [currentDate, isMounted]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && formattedDate) {
            breadService.ensureOrdersForDate(formattedDate);
            setSelectedOrders(new Set());
        }
    }, [formattedDate, isMounted]);

    // deps are stabilized to prevent infinite render loops
    const liveDeps = useMemo(() => [formattedDate, isMounted], [formattedDate, isMounted]);
    
    const { value: orders, isLoading, refresh } = useLiveQuery<BreadOrderWithCustomer[]>(
        () => isMounted ? breadService.getOrdersForDate(formattedDate) : Promise.resolve([]),
        liveDeps
    );

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        let list = orders;
        
        // 1. Search Query (Optimized)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(o => 
                o.orderNumber.toLowerCase().includes(q) ||
                (o.customer && `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(q)) ||
                (o.customName && o.customName.toLowerCase().includes(q))
            );
        }

        // 2. Delivery Status Filter
        if (filterDelivery === 'delivered') {
            list = list.filter(o => o.isDelivered);
        } else if (filterDelivery === 'pending') {
            list = list.filter(o => !o.isDelivered);
        }

        // 3. Payment Status Filter
        if (filterPayment === 'paid') {
            list = list.filter(o => o.isPaid);
        } else if (filterPayment === 'unpaid') {
            list = list.filter(o => !o.isPaid);
        }

        return list;
    }, [orders, searchQuery, filterDelivery, filterPayment]);

    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    }, []);

    const resetFilters = () => {
        setSearchQuery('');
        setFilterDelivery('all');
        setFilterPayment('all');
    };

    const isFiltered = searchQuery !== '' || filterDelivery !== 'all' || filterPayment !== 'all';

    const runAutomatedTask = useCallback(async () => {
        setIsProcessing(true);
        try {
            const count = await breadService.processEndOfDayTransfers();
            if (count > 0) toast.success(`${count} ordres transférés au registre.`);
            else toast.info("Audit terminé : Aucun ordre en souffrance.");
        } catch (e: unknown) {
            const error = e as Error;
            toast.error("Échec de l'auto-facturation.", { description: error.message });
        } finally {
            setIsProcessing(false);
            setIsAutoBillingConfirmOpen(false);
        }
    }, []);

    useKeyboardShortcuts([
        { key: 'ArrowLeft', action: () => handleDateChange(-1), description: 'Jour précédent', ignoreInputFocus: true },
        { key: 'ArrowRight', action: () => handleDateChange(1), description: 'Jour suivant', ignoreInputFocus: true },
        { key: 'n', alt: true, action: () => setIsFormOpen(true), description: 'Nouvelle distribution [Alt+N]', ignoreInputFocus: false },
        { key: 'r', alt: true, action: () => refresh(), description: 'Actualiser flux [Alt+R]', ignoreInputFocus: false }
    ], 'LogistiquePain', isMounted && !isFormOpen);

    if (!isMounted) return null;

    return (
        <div className="p-6 space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-1000 pb-24">
            <PageHeader 
                title="Logistique Pain Elite"
                description={format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <PrintBreadListDialog orders={filteredOrders} currentDate={formattedDate} />
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setIsAutoBillingConfirmOpen(true)}
                                    disabled={isProcessing}
                                    className="rounded-xl border-amber-500/20 bg-amber-500/5 text-amber-600 gap-2 hover:bg-amber-500/10 font-black text-[10px] uppercase tracking-widest shadow-sm"
                                >
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                                    Auto-facturation
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-center font-bold">
                                Convertir les impayés des jours passés en dettes réelles au grand livre.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <div className="flex gap-1 bg-black/20 p-1 rounded-2xl border border-white/5 shadow-inner">
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(-1)} className="rounded-xl h-9 w-9"><ChevronLeft className="h-5 w-5 text-primary" /></Button>
                        <Button variant={formattedDate === formatDateToYYYYMMDD(new Date()) ? "secondary" : "ghost"} onClick={() => setCurrentDate(new Date())} className="rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-[0.2em]">Aujourd'hui</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)} className="rounded-xl h-9 w-9"><ChevronRight className="h-5 w-5 text-primary" /></Button>
                    </div>
                    
                    <Button onClick={() => setIsFormOpen(true)} className="rounded-2xl h-10 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl gap-3">
                        <Plus className="h-4 w-4" /> Saisie [Alt+N]
                    </Button>
                    
                    <Button variant="outline" size="icon" onClick={() => refresh()} className="rounded-xl h-10 w-10 border-white/5 bg-card/40 hover:bg-primary/5 transition-all">
                        <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-col lg:flex-row justify-between gap-6 items-end lg:items-center bg-card/20 p-2 rounded-2xl border border-white/5 shadow-inner">
                    <TabsList className="bg-black/20 border-none p-1 h-12 rounded-xl">
                        <TabsTrigger value="distribution" className="rounded-lg px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Distribution</TabsTrigger>
                        <TabsTrigger value="subscribers" className="rounded-lg px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Registre Abonnés</TabsTrigger>
                    </TabsList>

                    {activeTab === 'distribution' && (
                        <div className="flex flex-wrap gap-3 items-center flex-grow max-w-5xl px-4">
                            <div className="relative flex-grow min-w-[250px] group">
                                <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-500", searchQuery ? "text-primary scale-110" : "text-muted-foreground/30")} />
                                <Input 
                                    placeholder="Rechercher un flux ou une référence..." 
                                    className="pl-12 h-11 rounded-xl bg-black/20 border-none shadow-inner font-black text-lg" 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/20 hover:text-destructive transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-11 rounded-xl border-white/5 bg-black/20 px-4 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-white/5">
                                            <Filter className="h-3.5 w-3.5 opacity-50" />
                                            {filterDelivery === 'all' ? 'Livraison' : filterDelivery === 'delivered' ? 'Livré' : 'Attente'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-xl border-white/5 shadow-2xl bg-card/95 backdrop-blur-md">
                                        <DropdownMenuLabel className="text-[9px] font-black uppercase text-muted-foreground/40 px-4 py-3">État de Distribution</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="opacity-10" />
                                        <DropdownMenuRadioGroup value={filterDelivery} onValueChange={v => setFilterDelivery(v as DeliveryFilter)}>
                                            <DropdownMenuRadioItem value="all" className="text-xs font-bold py-3 px-4">Tous les états</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="delivered" className="text-xs font-bold py-3 px-4 text-emerald-500">Flux Distribués</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="pending" className="text-xs font-bold py-3 px-4 text-amber-500">En attente</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-11 rounded-xl border-white/5 bg-black/20 px-4 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-white/5">
                                            <Filter className="h-3.5 w-3.5 opacity-50" />
                                            {filterPayment === 'all' ? 'Règlement' : filterPayment === 'paid' ? 'Payé' : 'Crédit'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-xl border-white/5 shadow-2xl bg-card/95 backdrop-blur-md">
                                        <DropdownMenuLabel className="text-[9px] font-black uppercase text-muted-foreground/40 px-4 py-3">Audit de Paiement</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="opacity-10" />
                                        <DropdownMenuRadioGroup value={filterPayment} onValueChange={v => setFilterPayment(v as PaymentFilter)}>
                                            <DropdownMenuRadioItem value="all" className="text-xs font-bold py-3 px-4">Toutes transactions</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="paid" className="text-xs font-bold py-3 px-4 text-emerald-500">Soldés Cash</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="unpaid" className="text-xs font-bold py-3 px-4 text-orange-500">Inscrits en Dette</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {isFiltered && (
                                    <Button variant="ghost" size="icon" onClick={resetFilters} className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10">
                                        <FilterX className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5 ml-auto shadow-inner">
                                <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9 transition-all" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                                <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9 transition-all" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    )}
                </div>

                <TabsContent value="distribution" className="space-y-8 outline-none animate-in fade-in duration-700">
                    <BreadStats date={formattedDate} />
                    
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                           {[...Array(8)].map((_, i) => <Skeleton className="h-64 w-full rounded-[2.5rem] bg-card/40 border border-white/5 animate-pulse" key={i} />)}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <EmptyState 
                            icon={Search} 
                            title="Zone de Silence" 
                            description={isFiltered ? "Ajustez vos filtres pour identifier des flux spécifiques." : "Aucune distribution programmée pour cette signature temporelle."}
                            actionLabel={isFiltered ? "Réinitialiser les filtres" : "Créer un ordre manuel"}
                            onAction={isFiltered ? resetFilters : () => setIsFormOpen(true)}
                        />
                    ) : (
                        <div className="animate-in fade-in duration-1000 slide-in-from-bottom-4">
                            {viewMode === 'list' ? (
                                <div className="bg-card/40 rounded-3xl border border-white/5 overflow-hidden shadow-xl">
                                    <BreadOrderTable orders={filteredOrders} selectedOrders={selectedOrders} onToggleSelection={(id) => setSelectedOrders(prev => {
                                        const next = new Set(prev);
                                        if (next.has(id)) next.delete(id); else next.add(id);
                                        return next;
                                    })} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                    {filteredOrders.map(o => (
                                        <BreadOrderCard key={o.uuid} order={o} isSelected={selectedOrders.has(o.uuid)} onToggleSelection={(id) => setSelectedOrders(prev => {
                                            const next = new Set(prev);
                                            if (next.has(id)) next.delete(id); else next.add(id);
                                            return next;
                                        })} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="subscribers" className="outline-none animate-in fade-in duration-700">
                    <BreadClientList onListChange={() => {}} />
                </TabsContent>
            </Tabs>

            <BreadOrderForm isOpen={isMounted && isFormOpen} onOpenChange={setIsFormOpen} currentDate={formattedDate} onSuccess={() => { setIsFormOpen(false); refresh(); }} />

            <ConfirmAlertDialog
                isOpen={isAutoBillingConfirmOpen}
                onOpenChange={setIsAutoBillingConfirmOpen}
                title="Audit de Clôture Logistique"
                description={
                    <div className="space-y-6">
                        <p className="font-bold text-foreground leading-relaxed">Cette opération convertit irréversiblement tous les ordres non régularisés des jours passés en créances au grand livre pour les abonnés Premium.</p>
                        <div className="p-5 bg-amber-500/10 border-2 border-amber-500/20 rounded-[1.5rem] flex gap-4 text-amber-700 shadow-inner relative overflow-hidden">
                            <Info className="h-6 w-6 shrink-0 mt-1" />
                            <div className="space-y-1 relative z-10">
                                <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-2">Avertissement Comptable</p>
                                <p className="text-[10px] font-bold uppercase leading-relaxed opacity-80">Ceci garantit l'intégrité de vos flux de trésorerie et la continuité de la chaîne de confiance avec vos clients.</p>
                            </div>
                        </div>
                    </div>
                }
                onConfirm={runAutomatedTask}
                confirmText="Valider Transfert Financier"
            />
        </div>
    );
}
