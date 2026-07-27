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
    RefreshCw,
    Filter,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DeliveryFilter = 'all' | 'delivered' | 'pending';
type PaymentFilter = 'all' | 'paid' | 'unpaid';

/**
 * iPOS Zen - Bread Logistics Page.
 * PRODUCTION AUDIT: Hardened hydration guards and stable selection logic.
 */
export default function BreadPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [filterDelivery, setFilterDelivery] = useState<DeliveryFilter>('all');
    const [filterPayment, setFilterPayment] = useState<PaymentFilter>('all');
    
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    
    const viewMode = useAppStore(state => state.breadViewMode);
    const setViewMode = useAppStore(state => state.actions.setBreadViewMode);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAutoBillingConfirmOpen, setIsAutoBillingConfirmOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('distribution');

    // 1. Initial Mount & Date Stabilization
    useEffect(() => {
        setIsMounted(true);
        setCurrentDate(new Date());
    }, []);

    const formattedDate = useMemo(() => 
        (isMounted && currentDate) ? formatDateToYYYYMMDD(currentDate) : '', 
        [currentDate, isMounted]
    );

    // 2. Automation: Ensure orders exist for current date view
    useEffect(() => {
        if (isMounted && formattedDate) {
            breadService.ensureOrdersForDate(formattedDate);
            // Clear selection on date change
            setSelectedOrders(new Set());
        }
    }, [formattedDate, isMounted]);

    // 3. Reactive Data Stream
    const { value: orders, isLoading, refresh } = useLiveQuery<BreadOrderWithCustomer[]>(
        () => (isMounted && formattedDate) ? breadService.getOrdersForDate(formattedDate) : Promise.resolve([]),
        [formattedDate, isMounted]
    );

    // 4. In-Memory Search & Filtering
    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        let list = [...orders];
        
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(o => 
                o.orderNumber.toLowerCase().includes(q) ||
                (o.customer && `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(q)) ||
                (o.customName && o.customName.toLowerCase().includes(q))
            );
        }

        if (filterDelivery === 'delivered') list = list.filter(o => o.isDelivered);
        else if (filterDelivery === 'pending') list = list.filter(o => !o.isDelivered);

        if (filterPayment === 'paid') list = list.filter(o => o.isPaid);
        else if (filterPayment === 'unpaid') list = list.filter(o => !o.isPaid);

        return list;
    }, [orders, searchQuery, filterDelivery, filterPayment]);

    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => prev ? addDays(prev, days) : new Date());
    }, []);

    const handleToggleAll = useCallback((checked: boolean) => {
        if (checked) {
            setSelectedOrders(new Set(filteredOrders.map(o => o.uuid)));
        } else {
            setSelectedOrders(new Set());
        }
    }, [filteredOrders]);

    const resetFilters = () => {
        setSearchQuery('');
        setFilterDelivery('all');
        setFilterPayment('all');
    };

    const isFiltered = searchQuery !== '' || filterDelivery !== 'all' || filterPayment !== 'all';

    // 5. Bulk End-of-Day Billing
    const runAutomatedTask = useCallback(async () => {
        setIsProcessing(true);
        try {
            const count = await breadService.processEndOfDayTransfers();
            if (count > 0) toast.success(`${count} ordres transférés au registre.`);
            else toast.info("Audit terminé : Aucun ordre en souffrance.");
            refresh();
        } catch (e: any) {
            toast.error("Échec de l'auto-facturation.", { description: e.message });
        } finally {
            setIsProcessing(false);
            setIsAutoBillingConfirmOpen(false);
        }
    }, [refresh]);

    useKeyboardShortcuts([
        { key: 'ArrowLeft', action: () => handleDateChange(-1), description: 'Jour précédent', ignoreInputFocus: true },
        { key: 'ArrowRight', action: () => handleDateChange(1), description: 'Jour suivant', ignoreInputFocus: true },
        { key: 'n', alt: true, action: () => setIsFormOpen(true), description: 'Nouvelle distribution [Alt+N]', ignoreInputFocus: false },
        { key: 'r', alt: true, action: () => refresh(), description: 'Actualiser flux [Alt+R]', ignoreInputFocus: false }
    ], 'LogistiquePain', isMounted && !isFormOpen);

    if (!isMounted || !currentDate) return null;

    return (
        <div className="p-2 sm:p-4 space-y-3 max-w-[1800px] mx-auto animate-in fade-in duration-500 pb-24">
            <PageHeader 
                title="Logistique Pain"
                description={format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <PrintBreadListDialog orders={filteredOrders} currentDate={formattedDate} />
                    
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAutoBillingConfirmOpen(true)}
                        disabled={isProcessing}
                        className="rounded-xl border-amber-500/20 bg-amber-500/5 text-amber-600 gap-2 font-black text-[10px] uppercase tracking-widest"
                    >
                        {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
                        Clôture
                    </Button>

                    <div className="flex gap-1 bg-black/10 p-1 rounded-xl border border-white/5">
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(-1)} className="rounded-lg h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant={formattedDate === formatDateToYYYYMMDD(new Date()) ? "secondary" : "ghost"} onClick={() => setCurrentDate(new Date())} className="rounded-lg h-8 px-4 text-[9px] font-black uppercase">Aujourd'hui</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)} className="rounded-lg h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                    
                    <Button onClick={() => setIsFormOpen(true)} className="rounded-xl h-9 font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm">
                        <Plus className="h-3 w-3" /> Saisie [Alt+N]
                    </Button>
                    
                    <Button variant="outline" size="icon" onClick={() => refresh()} className="rounded-xl h-9 w-9">
                        <RefreshCw className={cn("h-3 w-3 text-primary", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex flex-col lg:flex-row justify-between gap-4 items-end lg:items-center bg-card/20 p-1 rounded-xl border border-white/5">
                    <TabsList className="bg-black/10 border-none p-1 h-10 rounded-lg">
                        <TabsTrigger value="distribution" className="rounded-md px-6 font-black text-[9px] uppercase tracking-widest">Distribution</TabsTrigger>
                        <TabsTrigger value="subscribers" className="rounded-md px-6 font-black text-[9px] uppercase tracking-widest">Abonnés</TabsTrigger>
                    </TabsList>

                    {activeTab === 'distribution' && (
                        <div className="flex flex-wrap gap-2 items-center flex-grow max-w-4xl px-2">
                            <div className="relative flex-grow group">
                                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30")} />
                                <Input 
                                    placeholder="Rechercher..." 
                                    className="pl-9 h-8 rounded-lg bg-black/10 border-none font-bold text-xs" 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                />
                            </div>

                            <div className="flex gap-1.5">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-8 rounded-lg border-white/5 bg-black/10 px-3 text-[9px] font-black uppercase tracking-widest gap-2">
                                            <Filter className="h-3.5 w-3.5 opacity-50" />
                                            {filterDelivery === 'all' ? 'Livraison' : filterDelivery === 'delivered' ? 'Livré' : 'Attente'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-xl">
                                        <DropdownMenuRadioGroup value={filterDelivery} onValueChange={v => setFilterDelivery(v as DeliveryFilter)}>
                                            <DropdownMenuRadioItem value="all" className="text-xs font-bold">Tous</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="delivered" className="text-xs font-bold text-emerald-500">Livrés</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="pending" className="text-xs font-bold text-amber-500">En attente</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-8 rounded-lg border-white/5 bg-black/10 px-3 text-[9px] font-black uppercase tracking-widest gap-2">
                                            <Filter className="h-3.5 w-3.5 opacity-50" />
                                            {filterPayment === 'all' ? 'Règlement' : filterPayment === 'paid' ? 'Payé' : 'Crédit'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-xl">
                                        <DropdownMenuRadioGroup value={filterPayment} onValueChange={v => setFilterPayment(v as PaymentFilter)}>
                                            <DropdownMenuRadioItem value="all" className="text-xs font-bold">Toutes transactions</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="paid" className="text-xs font-bold text-emerald-500">Soldés Cash</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="unpaid" className="text-xs font-bold text-orange-500">Dettes</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {isFiltered && (
                                    <Button variant="ghost" size="icon" onClick={resetFilters} className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10">
                                        <FilterX className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex bg-black/10 p-1 rounded-xl border border-white/5 ml-auto">
                                <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-lg h-7 w-7" onClick={() => setViewMode('grid')}><LayoutGrid className="h-3.5 w-3.5"/></Button>
                                <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-lg h-7 w-7" onClick={() => setViewMode('list')}><List className="h-3.5 w-3.5"/></Button>
                            </div>
                        </div>
                    )}
                </div>

                <TabsContent value="distribution" className="space-y-4 outline-none">
                    <BreadStats date={formattedDate} />
                    
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           {[...Array(8)].map((_, i) => <Skeleton className="h-40 w-full rounded-2xl bg-card/20 animate-pulse" key={i} />)}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <EmptyState 
                            icon={Search} 
                            title="Zone de Silence" 
                            description={isFiltered ? "Ajustez vos filtres." : "Aucune distribution pour cette date."}
                            actionLabel={isFiltered ? "Réinitialiser" : "Créer un ordre"}
                            onAction={isFiltered ? resetFilters : () => setIsFormOpen(true)}
                        />
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            {viewMode === 'list' ? (
                                <BreadOrderTable 
                                    orders={filteredOrders} 
                                    selectedOrders={selectedOrders} 
                                    onToggleSelection={(id) => setSelectedOrders(prev => {
                                        const next = new Set(prev);
                                        if (next.has(id)) next.delete(id); else next.add(id);
                                        return next;
                                    })} 
                                    onToggleAll={handleToggleAll}
                                />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                                    {filteredOrders.map(o => (
                                        <BreadOrderCard 
                                            key={o.uuid} 
                                            order={o} 
                                            isSelected={selectedOrders.has(o.uuid)} 
                                            onToggleSelection={(id) => setSelectedOrders(prev => {
                                                const next = new Set(prev);
                                                if (next.has(id)) next.delete(id); else next.add(id);
                                                return next;
                                            })} 
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

            <BreadOrderForm 
                isOpen={isMounted && isFormOpen} 
                onOpenChange={setIsFormOpen} 
                currentDate={formattedDate} 
                onSuccess={() => { setIsFormOpen(false); refresh(); }} 
            />

            <ConfirmAlertDialog
                isOpen={isAutoBillingConfirmOpen}
                onOpenChange={setIsAutoBillingConfirmOpen}
                title="Clôture Logistique"
                description="Cette opération convertit les ordres non régularisés des jours passés en dettes réelles au grand livre pour les abonnés."
                onConfirm={runAutomatedTask}
                confirmText="Valider le transfert"
            />
        </div>
    );
}
