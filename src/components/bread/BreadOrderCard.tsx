'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { CircleCheckBig, CircleUser, Package, Landmark, Loader2, Trash2, User, Sparkles, Hash } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

interface BreadOrderCardProps {
    order: BreadOrderWithCustomer;
    isSelected: boolean;
    onToggleSelection: (orderId: string) => void;
    onUpdate: () => void;
}

export function BreadOrderCard({ order, isSelected, onToggleSelection, onUpdate }: BreadOrderCardProps) {
    const [quantity, setQuantity] = useState(order.quantity);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const debouncedQuantity = useDebounce(quantity, 500);
    const breadPrice = useAppStore((state) => state.companyProfile?.breadPrice) || 0;

    const isPaid = !!order.saleUuid;
    const isDelivered = order.isDelivered;
    const isExternal = !order.customerUuid;
    const displayName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : (order.customName || 'Inconnu');

    const handleQuantityChange = useCallback(async (newQuantity: number) => {
        if (newQuantity < 0 || isPaid) return;
        try {
            await breadService.updateBreadOrderQuantity(order.uuid, newQuantity);
            onUpdate();
        } catch (error) {
            toast.error("Erreur lors de la mise à jour de la quantité.");
        }
    }, [order.uuid, onUpdate, isPaid]);

    useEffect(() => {
        if (debouncedQuantity !== order.quantity && !isPaid) {
            handleQuantityChange(debouncedQuantity);
        }
    }, [debouncedQuantity, order.quantity, handleQuantityChange, isPaid]);
    
    useEffect(() => {
        setQuantity(order.quantity);
    }, [order.quantity]);

    const toggleDelivery = async () => {
        setIsUpdatingStatus(true);
        try {
            await breadService.updateBreadOrderDeliveryStatus(order.uuid, !isDelivered);
            onUpdate();
        } catch (e) {
            toast.error("Erreur lors du changement de statut de livraison.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleQuickPay = async () => {
        if (breadPrice <= 0) {
            toast.error("Prix du pain non défini.");
            return;
        }
        setIsUpdatingStatus(true);
        try {
            await breadService.convertBreadOrdersToSales([order.uuid], breadPrice);
            toast.success("Commande convertie en vente.");
            onUpdate();
        } catch (e) {
            toast.error("Erreur lors du traitement du paiement.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (isPaid) return;
        try {
            await breadService.deleteBreadOrder(order.uuid);
            toast.success("Commande supprimée.");
            onUpdate();
        } catch (e) {
            toast.error("Erreur lors de la suppression.");
        }
    };

    return (
        <Card className={cn(
            "app-card group flex flex-col transition-all duration-500 bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden rounded-lg", 
            isSelected ? "ring-2 ring-primary border-primary/30 shadow-sm scale-[1.02] z-10" : "hover:bg-primary/5",
            isPaid ? "opacity-80" : "bg-card",
            isExternal && !isPaid && "border-l-4 border-l-amber-500/30"
        )}>
            <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                <Sparkles className="h-32 w-32 rotate-12" />
            </div>

            <div className="absolute top-6 right-6 z-10 flex gap-3 items-center" onClick={(e) => e.stopPropagation()}>
                {!isPaid && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
                {!isPaid ? (
                    <div className="p-1.5 bg-background/80 backdrop-blur-md rounded-xl border border-white/5 shadow-sm">
                        <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection(order.uuid)} className="h-6 w-6 border-primary data-[state=checked]:bg-primary" />
                    </div>
                ) : (
                    <div className="p-2 rounded-xl bg-emerald-500/10 shadow-inner">
                        <CircleCheckBig className="h-5 w-5 text-emerald-500 animate-in zoom-in" />
                    </div>
                )}
            </div>

            <CardHeader className="p-4 pb-4 space-y-3 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        {isExternal ? (
                            <div className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                                <CircleUser className="h-2.5 w-2.5" /> Client Passager
                            </div>
                        ) : (
                            <div className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[8px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                                <User className="h-2.5 w-2.5" /> Abonné Premium
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-xl font-semibold leading-tight tracking-tighter group-hover:text-primary transition-colors truncate pr-16">
                        {displayName}
                    </CardTitle>
                    {isPaid && (
                        <p className="text-[10px] font-mono font-semibold uppercase text-emerald-600/60 mt-1 flex items-center gap-1.5 tracking-tighter">
                            <Hash className="h-2.5 w-2.5" /> Vente validée
                        </p>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-6 relative z-10">
                <div className="flex items-center gap-4 bg-black/20 rounded-lg p-3 border border-white/5 group-hover:border-primary/20 transition-all shadow-inner">
                    <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shadow-inner">
                        <Package className="h-5 w-5" />
                    </div>
                    <div className="flex-grow relative">
                        <Input 
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            className="h-9 text-xl font-semibold text-center bg-transparent border-none focus-visible:ring-0 w-full text-primary"
                            disabled={isPaid}
                            min="0"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground opacity-20">PCS</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                    <Button 
                        variant={isDelivered ? "secondary" : "outline"} 
                        size="lg"
                        onClick={toggleDelivery}
                        disabled={isUpdatingStatus || isPaid}
                        className={cn(
                            "rounded-2xl h-12 font-semibold text-[10px] uppercase tracking-wide gap-2 shadow-sm transition-all active:scale-95",
                            isDelivered ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "border-white/5 bg-card/40"
                        )}
                    >
                        {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                        {isDelivered ? 'LIVRÉ' : 'LIVRER'}
                    </Button>
                    <Button 
                        variant={isPaid ? "secondary" : "outline"} 
                        size="lg"
                        onClick={handleQuickPay}
                        disabled={isPaid || isUpdatingStatus}
                        className={cn(
                            "rounded-2xl h-12 font-semibold text-[10px] uppercase tracking-wide gap-2 shadow-sm transition-all active:scale-95",
                            isPaid ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "border-white/5 bg-card/40"
                        )}
                    >
                        {isPaid ? <CircleCheckBig className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
                        {isPaid ? 'SOLDE' : 'COMPTE'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
