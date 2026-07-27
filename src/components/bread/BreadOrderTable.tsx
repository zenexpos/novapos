'use client';

import React, { useState, memo, useCallback } from 'react';
import type { BreadOrderWithCustomer } from '@/lib/types';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
    Trash2, 
    User, 
    Hash, 
    CircleUser,
    CheckCircle2
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { breadService } from '@/services/bread.service';
import { toast } from 'sonner';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

interface BreadOrderTableProps {
    orders: BreadOrderWithCustomer[];
    selectedOrders: Set<string>;
    onToggleSelection: (uuid: string) => void;
    onToggleAll: (checked: boolean) => void;
}

const BreadOrderTableComponent = ({ orders, selectedOrders, onToggleSelection, onToggleAll }: BreadOrderTableProps) => {
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    const handleTogglePickup = useCallback(async (order: BreadOrderWithCustomer) => {
        if (order.saleUuid) return;
        const newState = !order.isDelivered;
        try {
            await breadService.bulkUpdateDeliveryStatus([order.uuid], newState);
            toast.success(newState ? 'Livré' : 'En attente');
        } catch (e) {
            toast.error("Erreur statut.");
        }
    }, []);

    const handleTogglePayment = useCallback(async (order: BreadOrderWithCustomer, checked: boolean) => {
        if (order.saleUuid) return;
        try {
            await breadService.updatePaymentStatus(order.uuid, checked);
            toast.success(checked ? 'Payé Cash' : 'Crédit');
        } catch (e) {
            toast.error("Erreur règlement.");
        }
    }, []);

    const handleDelete = useCallback(async () => {
        if (!orderToDelete) return;
        try {
            await breadService.deleteBreadOrder(orderToDelete);
            toast.success("Flux supprimé.");
        } catch (e: any) {
            toast.error(e.message || "Action refusée.");
        } finally {
            setOrderToDelete(null);
        }
    }, [orderToDelete]);

    const isAllSelected = orders.length > 0 && orders.every(o => selectedOrders.has(o.uuid));

    return (
        <>
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-none h-10">
                        <TableHead className="w-12 px-6">
                            <Checkbox 
                                checked={isAllSelected}
                                onCheckedChange={(checked) => onToggleAll(!!checked)}
                                className="border-primary data-[state=checked]:bg-primary"
                                aria-label="Tout sélectionner"
                            />
                        </TableHead>
                        <TableHead className="p-2 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Identifiant</TableHead>
                        <TableHead className="p-2 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Client / Partenaire</TableHead>
                        <TableHead className="p-2 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest text-center">Qté</TableHead>
                        <TableHead className="p-2 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest text-right">Valeur</TableHead>
                        <TableHead className="p-2 text-[10px] font-black uppercase text-muted-foreground/60 text-center">Règlement</TableHead>
                        <TableHead className="p-2 text-[10px] font-black uppercase text-muted-foreground/60 text-center">Livraison</TableHead>
                        <TableHead className="p-2 text-[10px] font-black uppercase text-muted-foreground/60 text-center">État</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-60 text-center opacity-20 italic font-black uppercase tracking-widest text-xs">Zone de silence logistique.</TableCell>
                        </TableRow>
                    ) : orders.map((order) => {
                        const isExternal = !order.customerUuid;
                        const isSelected = selectedOrders.has(order.uuid);
                        const displayName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : (order.customName || 'Passage');
                        
                        return (
                            <TableRow key={order.uuid} className={cn("group border-b border-white/5 transition-all h-10", isSelected ? "bg-primary/5" : "hover:bg-primary/5")}>
                                <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(order.uuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                        aria-label={`Choisir ${displayName}`}
                                    />
                                </TableCell>
                                <TableCell className="p-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] font-bold tracking-tighter opacity-40">{order.orderNumber}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-2">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-1.5 rounded-lg shadow-inner",
                                            isExternal ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                                        )}>
                                            {isExternal ? <CircleUser className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                        </div>
                                        <span className="font-black text-xs tracking-tight uppercase truncate max-w-[200px]">{displayName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-2 text-center">
                                    <Badge variant="outline" className="rounded-lg font-black bg-black/20 border-white/5 px-2 h-7 tabular-nums text-[10px]">
                                        {order.quantity}
                                    </Badge>
                                </TableCell>
                                <TableCell className="p-2 text-right font-black text-xs tabular-nums tracking-tighter">
                                    {formatCurrency(order.totalAmount)}
                                </TableCell>
                                <TableCell className="p-2 text-center">
                                    <Switch 
                                        checked={order.isPaid} 
                                        onCheckedChange={(checked) => handleTogglePayment(order, checked)}
                                        disabled={!!order.saleUuid}
                                        className="data-[state=checked]:bg-emerald-500 scale-75"
                                        aria-label="Toggle payé"
                                    />
                                </TableCell>
                                <TableCell className="p-2 text-center">
                                    <Switch 
                                        checked={order.isDelivered} 
                                        onCheckedChange={() => handleTogglePickup(order)}
                                        disabled={!!order.saleUuid}
                                        className="data-[state=checked]:bg-emerald-500 scale-75"
                                        aria-label="Toggle livré"
                                    />
                                </TableCell>
                                <TableCell className="p-2 text-center">
                                    {order.saleUuid ? (
                                        <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[7px] font-black uppercase px-1.5 h-5">
                                            <CheckCircle2 className="h-2 w-2" /> FACTURÉ
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground/30 text-[7px] font-black uppercase px-1.5 h-5 border-white/5">
                                            LOCAL
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="p-2 text-right">
                                    {!order.saleUuid && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            aria-label="Supprimer"
                                            className="h-7 w-7 text-destructive/20 hover:text-destructive hover:bg-destructive/5"
                                            onClick={() => setOrderToDelete(order.uuid)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>

        <ConfirmAlertDialog 
            isOpen={!!orderToDelete}
            onOpenChange={(open) => !open && setOrderToDelete(null)}
            title="Supprimer cet ordre ?"
            description="Cette action est irréversible et annulera ce flux de distribution."
            onConfirm={handleDelete}
            confirmText="Supprimer définitivement"
        />
        </>
    );
};

export const BreadOrderTable = memo(BreadOrderTableComponent);
