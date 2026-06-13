'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BreadStats } from '@/components/bread/BreadStats';
import { BreadOrderTable } from '@/components/bread/BreadOrderTable';
import { BreadOrderForm } from '@/components/bread/BreadOrderForm';
import { BreadClientList } from '@/components/bread/BreadClientList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Loader2, 
    ChevronLeft, 
    ChevronRight, 
    Plus,
    Search,
    Clock,
    Users,
    Calendar,
    Filter,
    FilterX,
    CheckCircle2,
    Truck,
    UserCheck,
    CloudUpload
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
import { cn } from '@/lib/utils';

/**
 * Page de gestion avancée du pain (Système Elite).
 */
export default function BreadPage() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    
    // Filtres avancés
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'delivered' | 'pending'>('all');
    const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'registered' | 'external'>('all');
    const [transferFilter, setTransferFilter] = useState<'all' | 'transferred' | 'local'>('all');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isProcessingTransfers, setIsProcessingTransfers] = useState(false);
    const [activeTab, setActiveTab] = useState('distribution');

    const formattedDate = formatDateToYYYYMMDD(currentDate);

    useEffect(() => {
        breadService.ensureOrdersForDate(formattedDate);
    }, [formattedDate]);

    const ordersResult = useLiveQuery<BreadOrderWithCustomer[] | undefined>(
        () => breadService.getOrdersForDate(formattedDate),
        [formattedDate],
        undefined
    );

    const filteredOrders = useMemo(() => {
        if (!ordersResult.value) return [];
        let list = ordersResult.value;

        // 1. Filtre Statut Paiement
        if (statusFilter !== 'all') {
            const isPaid = statusFilter === 'paid';
            list = list.filter(o => o.isPaid === isPaid);
        }

        // 2. Filtre Statut Livraison
        if (deliveryFilter !== 'all') {
            const isDelivered = deliveryFilter === 'delivered';
            list = list.filter(o => o.isDelivered === isDelivered);
        }

        // 3. Filtre Type Client
        if (clientTypeFilter !== 'all') {
            if (clientTypeFilter === 'registered') {
                list = list.filter(o => !!o.customerUuid);
            } else {
                list = list.filter(o => !o.customerUuid);
            }
        }

        // 4. Filtre Statut Transfert
        if (transferFilter !== 'all') {
            const isTransferred = transferFilter === 'transferred';
            list = list.filter(o => o.transferredToCustomerAccount === isTransferred);
        }

        // 5. Filtre Recherche (Nom, N°, Téléphone)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(o => 
                o.orderNumber.toLowerCase().includes(q) ||
                (o.customer && (o.customer.firstName + ' ' + o.customer.lastName).toLowerCase().includes(q)) ||
                (o.customer && o.customer.phone?.includes(q)) ||
                (o.customName && o.customName.toLowerCase().includes(q))
            );
        }
        return list;
    }, [ordersResult.value, searchQuery, statusFilter, deliveryFilter, clientTypeFilter, transferFilter]);

    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    }, []);

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setDeliveryFilter('all');
        setClientTypeFilter('all');
        setTransferFilter('all');
    };

    const isFiltered = searchQuery !== '' || statusFilter !== 'all' || deliveryFilter !== 'all' || clientTypeFilter !== 'all' || transferFilter !== 'all';

    const runAutomatedTask = async () => {
        setIsProcessingTransfers(true);
        try {
            const count = await breadService.processEndOfDayTransfers();
            if (count > 0) toast.success(`${count} ordres transférés aux comptes.`);
            else toast.info("Aucun ordre en attente de transfert.");
        } finally {
            setIsProcessingTransfers(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'ArrowLeft', action: () => handleDateChange(-1), description: 'Jour précédent', ignoreInputFocus: true },
        { key: 'ArrowRight', action: () => handleDateChange(1), description: 'Jour suivant', ignoreInputFocus: true },
        { key: 'n', action: () => setIsFormOpen(true), description: 'Nouvelle commande [N]', ignoreInputFocus: false }
    ], 'Pain');

    return (
        <div className="p-6 space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-700">
            <PageHeader 
                title="Gestion des Commandes de Pain Elite"
                description={format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            >
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={runAutomatedTask}
                        disabled={isProcessingTransfers}
                        className="rounded-xl border-amber-500/20 bg-amber-500/5 text-amber-600 gap-2 hover:bg-amber-500/10"
                    >
                        {isProcessingTransfers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                        Automatisation
                    </Button>

                    <div className="flex gap-1 bg-black/20 p-1 rounded-2xl border border-white/5 shadow-inner">
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(-1)} className="rounded-xl h-9 w-9">
                            <ChevronLeft className="h-5 w-5 text-primary" />
                        </Button>
                        <Button 
                            variant={formattedDate === formatDateToYYYYMMDD(new Date()) ? "secondary" : "ghost"} 
                            onClick={() => setCurrentDate(new Date())} 
                            className="rounded-xl h-9 px-4 text-[10px] uppercase font-bold"
                        >
                            Aujourd'hui
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)} className="rounded-xl h-9 w-9">
                            <ChevronRight className="h-5 w-5 text-primary" />
                        </Button>
                    </div>
                    
                    <Button onClick={() => setIsFormOpen(true)} className="rounded-2xl h-10 font-bold shadow-lg gap-2">
                        <Plus className="h-4 w-4" /> Nouvelle commande [N]
                    </Button>
                </div>
            </PageHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <TabsList className="bg-card/40 border border-white/5 p-1 h-12 rounded-2xl">
                        <TabsTrigger value="distribution" className="rounded-xl px-8 font-bold text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Calendar className="h-4 w-4 mr-2" /> Distribution
                        </TabsTrigger>
                        <TabsTrigger value="subscribers" className="rounded-xl px-8 font-bold text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Users className="h-4 w-4 mr-2" /> Abonnés Quotidiens
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === 'distribution' && (
                        <div className="flex gap-3 flex-grow max-w-3xl">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input 
                                    placeholder="Rechercher par client, téléphone ou N°..."
                                    className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className={cn(
                                        "h-11 rounded-xl border-none bg-card shadow-sm gap-2 px-4 transition-all",
                                        isFiltered && "bg-primary/10 text-primary"
                                    )}>
                                        <Filter className="h-4 w-4 opacity-40" />
                                        <span className="text-xs font-bold uppercase tracking-tight">Filtres</span>
                                        {isFiltered && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse ml-1" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="rounded-xl border-white/5 shadow-xl w-64 p-2">
                                    <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">Paiement</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                                        <DropdownMenuRadioItem value="all" className="text-xs font-bold uppercase">Tous les flux</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="paid" className="text-xs font-bold uppercase text-emerald-500">Payés</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="unpaid" className="text-xs font-bold uppercase text-orange-500">Non payés</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                    
                                    <DropdownMenuSeparator className="my-1 opacity-10" />
                                    <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">Livraison</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={deliveryFilter} onValueChange={(v: any) => setDeliveryFilter(v)}>
                                        <DropdownMenuRadioItem value="all" className="text-xs font-bold uppercase">Tous</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="delivered" className="text-xs font-bold uppercase text-emerald-500">Livrés</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="pending" className="text-xs font-bold uppercase text-amber-500">En attente</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>

                                    <DropdownMenuSeparator className="my-1 opacity-10" />
                                    <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">Origine Client</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={clientTypeFilter} onValueChange={(v: any) => setClientTypeFilter(v)}>
                                        <DropdownMenuRadioItem value="all" className="text-xs font-bold uppercase">Tous</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="registered" className="text-xs font-bold uppercase text-primary">Premium / Abonnés</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="external" className="text-xs font-bold uppercase">Passagers</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>

                                    <DropdownMenuSeparator className="my-1 opacity-10" />
                                    <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">Grand Livre</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={transferFilter} onValueChange={(v: any) => setTransferFilter(v)}>
                                        <DropdownMenuRadioItem value="all" className="text-xs font-bold uppercase">Tous</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="transferred" className="text-xs font-bold uppercase text-blue-500">Transférés</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="local" className="text-xs font-bold uppercase">Locale uniquement</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {isFiltered && (
                                <Button variant="ghost" size="icon" onClick={resetFilters} className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10">
                                    <FilterX className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <TabsContent value="distribution" className="space-y-6 outline-none">
                    <BreadStats date={formattedDate} />
                    <div className="bg-card/40 backdrop-blur-sm rounded-lg border border-white/5 overflow-hidden min-h-[500px]">
                        {ordersResult.isLoading ? (
                            <div className="flex flex-col items-center justify-center h-[500px] opacity-20">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <p className="mt-4 font-bold uppercase tracking-widest">Chargement du registre...</p>
                            </div>
                        ) : (
                            <BreadOrderTable orders={filteredOrders} />
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="subscribers" className="outline-none">
                    <div className="grid grid-cols-1 gap-6 min-h-[500px]">
                        <BreadClientList onListChange={() => ordersResult.refresh()} />
                    </div>
                </TabsContent>
            </Tabs>

            <BreadOrderForm 
                isOpen={isFormOpen} 
                onOpenChange={setIsFormOpen} 
                currentDate={formattedDate}
                onSuccess={() => ordersResult.refresh()}
            />
        </div>
    );
}
