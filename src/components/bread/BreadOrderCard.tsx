// ... (previous content preserved with fix)
'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { cn, formatCurrency, roundQty } from '@/lib/utils';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { 
    CircleCheckBig, 
    CircleUser, 
    Package, 
    Landmark, 
    Loader2, 
    Trash2, 
    User, 
    Banknote,
    Clock
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BreadOrderCardProps {
    order: BreadOrderWithCustomer;
    isSelected: boolean;
    onToggleSelection: (orderUuid: string) => void;
}

const BreadOrderCardComponent = ({ order, isSelected, onToggleSelection }: BreadOrderCardProps) => {
    const [quantity, setQuantity] = useState(order.quantity);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const debouncedQuantity = useDebounce(quantity, 800);
    const breadPrice = useAppStore((state) => state.companyProfile?.breadPrice) || 10;

    const isBilled = !!order.saleUuid;
    const isPaid = order.isPaid;
    const isDelivered = order.isDelivered;
    const isExternal = !order.customerUuid;
    const displayName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : (order.customName || 'Inconnu');

    const handleQuantityChange = useCallback(async (newQuantity: number) => {
        const val = roundQty(newQuantity);
        if (isNaN(val) || val < 0 || isBilled) return;
        try {
            await breadService.updateBreadOrderQuantity(order.uuid, val);
        } catch (error) {
            toast.error("Échec de la mise à jour quantité.");
        }
    }, [order.uuid, isBilled]);

    useEffect(() => {
        if (Math.abs(debouncedQuantity - order.quantity) > 0.001 && !isBilled) {
            handleQuantityChange(debouncedQuantity);
        }
    }, [debouncedQuantity, order.quantity, handleQuantityChange, isBilled]);
    
    useEffect(() => {
        setQuantity(order.quantity);
    }, [order.quantity]);

    const toggleDelivery = useCallback(async () => {
        if (isUpdatingStatus || isBilled) return;
        setIsUpdatingStatus(true);
        try {
            await breadService.bulkUpdateDeliveryStatus([order.uuid], !isDelivered);
            toast.success(isDelivered ? "Livraison annulée" : "Marqué comme livré");
        } catch (e) {
            toast.error("Erreur statut livraison.");
        } finally {
            setIsUpdatingStatus(false);
        }
    }, [order.uuid, isDelivered, isUpdatingStatus, isBilled]);

    const togglePayment = useCallback(async (checked: boolean) => {
        if (isUpdatingStatus || isBilled) return;
        setIsUpdatingStatus(true);
        try {
            await breadService.updatePaymentStatus(order.uuid, checked);
            toast.success(checked ? "Validé Cash" : "Mis en attente");
        } catch (e) {
            toast.error("Erreur règlement.");
        } finally {
            setIsUpdatingStatus(false);
        }
    }, [order.uuid, isUpdatingStatus, isBilled]);

    const handleQuickPay = useCallback(async () => {
        if (isExternal) {
            toast.error("Compte requis", { description: "Seuls les clients Premium peuvent être facturés au compte." });
            return;
        }
        setIsUpdatingStatus(true);
        try {
            await breadService.convertBreadOrdersToSales([order.uuid], breadPrice);
            toast.success("Opération comptable validée.");
        } catch (e) {
            toast.error("Erreur transfert financier.");
        } finally {
            setIsUpdatingStatus(false);
        }
    }, [order.uuid, isExternal, breadPrice]);

    const handleDelete = useCallback(async () => {
        if (isBilled) return;
        try {
            await breadService.deleteBreadOrder(order.uuid);
            toast.success("Ordre supprimé.");
        } catch (e) {
            toast.error("Action impossible.");
        }
    }, [order.uuid, isBilled]);

    return (
        <Card className={cn(
            "app-card group flex flex-col transition-all duration-300 bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden rounded-3xl", 
            isSelected ? "ring-2 ring-primary border-primary/30 shadow-xl" : "hover:bg-primary/5 shadow-sm",
            isBilled ? "opacity-75 grayscale-[0.3]" : "bg-card",
        )}>
            <div className="absolute top-6 right-6 z-10 flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                {!isBilled && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        aria-label="Supprimer ordre"
                        className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={handleDelete} 
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
                <div className="p-1.5 bg-background/80 backdrop-blur-md rounded-xl border border-white/5 shadow-sm">
                    {isBilled ? (
                        <CircleCheckBig className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <Checkbox 
                            checked={isSelected} 
                            onCheckedChange={() => onToggleSelection(order.uuid)} 
                            className="h-5 w-5 border-primary data-[state=checked]:bg-primary" 
                        />
                    )}
                </div>
            </div>

            <CardHeader className="p-6 pb-2 space-y-3 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        {isExternal ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-black uppercase flex items-center gap-1 px-2 py-0.5">
                                <CircleUser className="h-2.5 w-2.5" /> Passage
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase flex items-center gap-1 px-2 py-0.5">
                                <User className="h-2.5 w-2.5" /> Premium
                            </Badge>
                        )}
                        <Badge className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 border-none",
                            isPaid ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"
                        )}>
                            {isPaid ? 'PAYÉ' : 'CRÉDIT'}
                        </Badge>
                    </div>
                    <CardTitle className="text-lg font-black leading-tight tracking-tighter truncate pr-14 uppercase">
                        {displayName}
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-5 relative z-10">
                <div className="flex items-center gap-4 bg-black/10 rounded-2xl p-4 border border-white/5 group-hover:border-primary/20 transition-all shadow-inner">
                    <div className="p-3 rounded-xl bg-muted text-muted-foreground shadow-inner">
                        <Package className="h-5 w-5" />
                    </div>
                    <div className="flex-grow relative">
                        <Input 
                            type="number"
                            aria-label="Quantité"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                            className="h-10 text-2xl font-black text-center bg-transparent border-none focus-visible:ring-0 w-full text-primary"
                            disabled={isBilled}
                            min="0"
                            step="0.1"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-muted-foreground opacity-20">PCS</span>
                    </div>
                </div>

                <div className="p-4 bg-muted/20 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <Banknote className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Paiement Cash</span>
                        </div>
                    </div>
                    <Switch 
                        checked={isPaid} 
                        onCheckedChange={togglePayment} 
                        disabled={isUpdatingStatus || isBilled}
                        className="data-[state=checked]:bg-emerald-500"
                        aria-label="Toggle paiement"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                    <Button 
                        variant={isDelivered ? "secondary" : "outline"} 
                        size="lg"
                        onClick={toggleDelivery}
                        disabled={isUpdatingStatus || isBilled}
                        className={cn(
                            "rounded-2xl h-11 font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm transition-all",
                            isDelivered ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "border-white/5 bg-card/40"
                        )}
                    >
                        {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                        {isDelivered ? 'LIVRÉ' : 'LIVRER'}
                    </Button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={isBilled ? "secondary" : "outline"} 
                                    size="lg"
                                    onClick={handleQuickPay}
                                    disabled={isBilled || isUpdatingStatus || isExternal}
                                    className={cn(
                                        "rounded-2xl h-11 font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm transition-all",
                                        isBilled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "border-white/5 bg-card/40"
                                    )}
                                >
                                    {isBilled ? <CircleCheckBig className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
                                    {isBilled ? 'FACTURÉ' : 'CRÉDIT'}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isBilled ? "Déjà intégré à la comptabilité" : isExternal ? "Compte Premium requis" : "Transférer la dette sur le compte client."}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    );
};

export const BreadOrderCard = memo(BreadOrderCardComponent);
