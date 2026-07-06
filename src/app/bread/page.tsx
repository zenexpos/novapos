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
    RefreshCw
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

export default function BreadPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
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

    const { value: orders, isLoading, refresh } = useLiveQuery<BreadOrderWithCustomer[]>(
        () => isMounted ? breadService.getOrdersForDate(formattedDate) : Promise.resolve([]),
        [formattedDate, isMounted]
    );

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        let list = orders;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(o => 
                o.orderNumber.toLowerCase().includes(q) ||
                (o.customer && `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(q)) ||
                (o.customName && o.customName.toLowerCase().includes(q))
            );
        }
        return list;
    }, [orders, searchQuery]);

    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    }, []);

    const runAutomatedTask = useCallback(async () => {
        setIsProcessing(true);
        try {
            const count = await breadService.processEndOfDayTransfers();
            if (count > 0) toast.success(`${count} ordres transférés au compte.`);
            else toast.info("Aucun ordre à transférer.");
        } catch (e: any) {
            toast.error("Erreur lors de l'auto-facturation.");
        } finally {
            setIsProcessing(false);
            setIsAutoBillingConfirmOpen(false);
        }
    }, []);

    useKeyboardShortcuts([
        { key: 'ArrowLeft', action: () => handleDateChange(-1), description: 'Jour précédent', ignoreInputFocus: true },
        { key: 'ArrowRight', action: () => handleDateChange(1), description: 'Jour suivant', ignoreInputFocus: true },
        { key: 'n', action: () => setIsFormOpen(true), description: 'Nouvelle commande [N]', ignoreInputFocus: false },
        { key: 'r', action: () => refresh(), description: 'Actualiser flux [R]', ignoreInputFocus: true }
    ], 'LogistiquePain', isMounted);

    if (!isMounted) return null;

    return (
        <div className="p-6 space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-700">
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
                                    className="rounded-xl border-amber-500/20 bg-amber-500/5 text-amber-600 gap-2 hover:bg-amber-500/10 font-bold"
                                >
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                                    Auto-facturation
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Transférer les impayés des jours passés en dettes réelles</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <div className="flex gap-1 bg-black/20 p-1 rounded-2xl border border-white/5">
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(-1)} className="rounded-xl h-9 w-9"><ChevronLeft className="h-5 w-5 text-primary" /></Button>
                        <Button variant={formattedDate === formatDateToYYYYMMDD(new Date()) ? "secondary" : "ghost"} onClick={() => setCurrentDate(new Date())} className="rounded-xl h-9 px-4 text-[10px] uppercase font-black tracking-widest">Aujourd'hui</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)} className="rounded-xl h-9 w-9"><ChevronRight className="h-5 w-5 text-primary" /></Button>
                    </div>
                    
                    <Button onClick={() => setIsFormOpen(true)} className="rounded-2xl h-10 font-black text-[10px] uppercase tracking-widest shadow-xl gap-2 bg-primary text-primary-foreground">
                        <Plus className="h-4 w-4" /> Nouvelle Commande [N]
                    </Button>
                    
                    <Button variant="outline" size="icon" onClick={() => refresh()} className="rounded-xl h-10 w-10 border-white/5 bg-card/40">
                        <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <TabsList className="bg-card/40 border border-white/5 p-1 h-12 rounded-2xl">
                        <TabsTrigger value="distribution" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest">Distribution</TabsTrigger>
                        <TabsTrigger value="subscribers" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest">Abonnés</TabsTrigger>
                    </TabsList>

                    {activeTab === 'distribution' && (
                        <div className="flex gap-3 flex-grow max-w-4xl">
                            <div className="relative flex-grow group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                                <Input placeholder="Rechercher flux..." className="pl-12 h-11 rounded-xl bg-card border-none shadow-inner font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
                                <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                                <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    )}
                </div>

                <TabsContent value="distribution" className="space-y-6 outline-none">
                    <BreadStats date={formattedDate} />
                    
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                           {[...Array(8)].map((_, i) => <Skeleton className="h-48 w-full rounded-3xl" key={i} />)}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <EmptyState 
                            icon={Search} 
                            title="Zone de Silence" 
                            description={searchQuery ? "Ajustez vos filtres de recherche." : "Aucune distribution prévue pour ce jour."}
                            actionLabel="Créer un ordre"
                            onAction={() => setIsFormOpen(true)}
                        />
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            {viewMode === 'list' ? (
                                <div className="bg-card/40 rounded-2xl border border-white/5 overflow-hidden shadow-sm">
                                    <BreadOrderTable orders={filteredOrders} selectedOrders={selectedOrders} onToggleSelection={(id) => setSelectedOrders(prev => {
                                        const next = new Set(prev);
                                        if (next.has(id)) next.delete(id); else next.add(id);
                                        return next;
                                    })} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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

                <TabsContent value="subscribers" className="outline-none">
                    <BreadClientList onListChange={() => {}} />
                </TabsContent>
            </Tabs>

            <BreadOrderForm isOpen={isMounted && isFormOpen} onOpenChange={setIsFormOpen} currentDate={formattedDate} onSuccess={() => setIsFormOpen(false)} />

            <ConfirmAlertDialog
                isOpen={isAutoBillingConfirmOpen}
                onOpenChange={setIsAutoBillingConfirmOpen}
                title="Audit de Clôture Logistique"
                description={
                    <div className="space-y-4">
                        <p>Cette opération va convertir tous les ordres non régularisés des jours passés en créances réelles sur les comptes clients Premium.</p>
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-amber-700">
                            <Info className="h-5 w-5 shrink-0" />
                            <p className="text-[10px] font-black uppercase leading-relaxed">Ceci est une action comptable irréversible qui garantit l'intégrité de vos flux de trésorerie.</p>
                        </div>
                    </div>
                }
                onConfirm={runAutomatedTask}
                confirmText="Valider Transfert"
            />
        </div>
    );
}