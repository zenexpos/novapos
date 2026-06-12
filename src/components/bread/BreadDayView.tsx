'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { BreadOrderCard } from './BreadOrderCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ManualAddDialog } from './ManualAddDialog';
import { PrintBreadListDialog } from './PrintBreadListDialog';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Loader2, Wheat, ShoppingBag, Power, AlertTriangle, Sparkles, LayoutGrid } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { ConfirmAlertDialog } from '../ui/ConfirmAlertDialog';

interface BreadDayViewProps {
    orders: BreadOrderWithCustomer[];
    currentDate: string;
    onOrdersChange: () => void;
}

export function BreadDayView({ orders, currentDate, onOrdersChange }: BreadDayViewProps) {
    const [selectedOrders, setSelectedOrders] = useState(new Set<string>());
    const [isConverting, setIsConverting] = useState(false);
    const [isClosingDay, setIsClosingDay] = useState(false);
    const breadPrice = useAppStore((state) => state.companyProfile?.breadPrice) || 0;

    const unbilledOrders = useMemo(() => orders.filter(o => !o.saleUuid), [orders]);
    const unbilledOrdersCount = unbilledOrders.length;

    const handleToggleSelection = (orderUuid: string) => {
        setSelectedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderUuid)) {
                newSet.delete(orderUuid);
            } else {
                newSet.add(orderUuid);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedOrders.size === unbilledOrdersCount) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(unbilledOrders.map(o => o.uuid)));
        }
    };
    
    const handleConvertToSales = async () => {
        if (selectedOrders.size === 0) return;
        if (breadPrice <= 0) {
            toast.error("Prix du pain non défini.", { description: "Veuillez configurer le prix dans votre profil." });
            return;
        }
        
        setIsConverting(true);
        try {
            await breadService.convertBreadOrdersToSales(Array.from(selectedOrders), breadPrice);
            toast.success(`${selectedOrders.size} commandes converties en dettes.`);
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("Erreur lors de la conversion.");
        } finally {
            setIsConverting(false);
        }
    };

    const handleFinalizeDay = async () => {
        if (unbilledOrdersCount === 0) return;
        if (breadPrice <= 0) {
            toast.error("Prix du pain non défini.");
            return;
        }

        setIsConverting(true);
        try {
            const count = await breadService.billAllRemainingOrdersForDate(currentDate, breadPrice);
            toast.success(`Clôture Elite terminée: ${count} commandes converties.`);
            onOrdersChange();
        } catch (e) {
            toast.error("Erreur lors de la clôture.");
        } finally {
            setIsConverting(false);
            setIsClosingDay(false);
        }
    };

    const isAllSelected = unbilledOrdersCount > 0 && selectedOrders.size === unbilledOrdersCount;

    if (orders.length === 0) {
        return (
             <Card className="rounded-lg border-none shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden h-full flex flex-col">
                <CardHeader className="bg-primary/5 border-b border-white/5 p-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                            <LayoutGrid className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg font-semibold tracking-tight">Distribution Journalière</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center min-h-[500px]">
                    <EmptyState
                        icon={Wheat}
                        title="Aucune commande détectée"
                        description="Le registre est vierge pour cette date. Commencez par un ajout manuel ou vérifiez vos abonnements."
                    >
                        <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                    </EmptyState>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <>
        <Card className="flex flex-col h-full rounded-lg border-none shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden">
            <CardHeader className="flex-shrink-0 bg-muted/20 border-b border-white/5 p-4 pb-10">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-sm">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold tracking-tight">Registre de Distribution</CardTitle>
                            <p className="text-[10px] text-primary/50 font-semibold uppercase mt-1">
                                {orders.length} flux identifiés pour aujourd'hui
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                        <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                        <PrintBreadListDialog orders={orders} currentDate={currentDate}/>
                        {unbilledOrdersCount > 0 && (
                            <Button 
                                variant="outline" 
                                className="rounded-2xl h-12 font-semibold text-[10px] uppercase tracking-wide border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all gap-2 px-6"
                                onClick={() => setIsClosingDay(true)}
                                disabled={isConverting}
                            >
                                <Power className="h-4 w-4" />
                                Clôturer & Facturer
                            </Button>
                        )}
                    </div>
                </div>

                {/* Elite Selection Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-8 bg-black/40 p-2.5 rounded-lg border border-white/5 shadow-inner backdrop-blur-sm">
                    <div className="flex items-center gap-4 px-6">
                        <Checkbox 
                            id="select-all-bread" 
                            checked={isAllSelected} 
                            onCheckedChange={handleSelectAll} 
                            className="h-6 w-6 border-primary data-[state=checked]:bg-primary rounded-xl transition-transform active:scale-90"
                        />
                        <label htmlFor="select-all-bread" className="text-[10px] font-semibold uppercase text-primary cursor-pointer select-none">
                            Sélection Elite pour facturation ({selectedOrders.size})
                        </label>
                    </div>
                    
                    <Button 
                        onClick={handleConvertToSales} 
                        disabled={selectedOrders.size === 0 || isConverting}
                        className={cn(
                            "rounded-2xl font-semibold h-12 px-4 transition-all uppercase text-[10px] tracking-wide",
                            selectedOrders.size > 0 ? "shadow-xl shadow-sm" : "opacity-20"
                        )}
                    >
                        {isConverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
                        Valider les transactions
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow min-h-0 p-4">
                <ScrollArea className="h-full pr-6 -mr-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {orders.map(order => (
                            <BreadOrderCard 
                                key={order.uuid} 
                                order={order}
                                isSelected={selectedOrders.has(order.uuid)}
                                onToggleSelection={handleToggleSelection}
                                onUpdate={onOrdersChange}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>

        <ConfirmAlertDialog 
            isOpen={isClosingDay}
            onOpenChange={setIsClosingDay}
            title="Confirmer la clôture souveraine ?"
            description={
                <div className="space-y-4">
                    <p className="font-medium">Vous allez convertir <b>{unbilledOrdersCount}</b> commandes en dettes fermes au prix de <b>{breadPrice} DA/pcs</b>.</p>
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 mt-4 text-amber-600">
                        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold uppercase tracking-tight leading-tight">Attention : Cette action est irréversible et modifiera instantanément les soldes de vos clients premium.</p>
                    </div>
                </div>
            }
            onConfirm={handleFinalizeDay}
            confirmText="Valider & Facturer tout"
        />
        </>
    );
}