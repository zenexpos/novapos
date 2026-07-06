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
    CloudUpload,
    CircleUser,
    CheckCircle2,
    Package
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
}

const BreadOrderTableComponent = ({ orders, selectedOrders, onToggleSelection }: BreadOrderTableProps) => {
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

    const isAllSelected = orders.length > 0 && selectedOrders.size === orders.length;

    const toggleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            orders.forEach(o => { if(!selectedOrders.has(o.uuid)) onToggleSelection(o.uuid); });
        } else {
            orders.forEach(o => { if(selectedOrders.has(o.uuid)) onToggleSelection(o.uuid); });
        }
    }, [orders, selectedOrders, onToggleSelection]);

    return (
        <>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/50 border-b border-white/5">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="w-12 px-6">
                            <Checkbox 
                                checked={isAllSelected}
                                onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                                className="border-primary data-[state=checked]:bg-primary"
                                aria-label="Tout sélectionner"
                            />
                        </TableHead>
                        <TableHead className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Identifiant</TableHead>
                        <TableHead className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Client / Partenaire</TableHead>
                        <TableHead className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest text-center">Qté</TableHead>
                        <TableHead className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest text-right">Valeur</TableHead>
                        <TableHead className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 text-center">Règlement</TableHead>
                        <TableHead className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 text-center">Livraison</TableHead>
                        <TableHead className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 text-center">État</TableHead>
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
                            <TableRow key={order.uuid} className={cn("group border-b border-white/5 transition-all", isSelected ? "bg-primary/5" : "hover:bg-primary/5")}>
                                <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(order.uuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                        aria-label={`Choisir ${displayName}`}
                                    />
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-3 w-3 opacity-30" />
                                        <span className="font-mono text-[10px] font-bold tracking-tighter">{order.orderNumber}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg shadow-inner",
                                            isExternal ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                                        )}>
                                            {isExternal ? <CircleUser className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                        </div>
                                        <div className="flex flex-col -space-y-0.5">
                                            <span className="font-black text-sm tracking-tight uppercase truncate max-w-[200px]">{displayName}</span>
                                            <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest">{isExternal ? 'Passage' : 'Premium'}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-center">
                                    <Badge variant="outline" className="rounded-xl font-black bg-black/20 border-white/5 px-4 h-8 tabular-nums">
                                        {order.quantity} <span className="ml-1 opacity-40">PCS</span>
                                    </Badge>
                                </TableCell>
                                <TableCell className="p-6 text-right font-black text-base tabular-nums tracking-tighter">
                                    {formatCurrency(order.totalAmount)}
                                </TableCell>
                                <TableCell className="p-6 text-center">
                                    <Switch 
                                        checked={order.isPaid} 
                                        onCheckedChange={(checked) => handleTogglePayment(order, checked)}
                                        disabled={!!order.saleUuid}
                                        className="data-[state=checked]:bg-emerald-500 scale-90"
                                        aria-label="Toggle payé"
                                    />
                                </TableCell>
                                <TableCell className="p-6 text-center">
                                    <Switch 
                                        checked={order.isDelivered} 
                                        onCheckedChange={() => handleTogglePickup(order)}
                                        disabled={!!order.saleUuid}
                                        className="data-[state=checked]:bg-emerald-500 scale-90"
                                        aria-label="Toggle livré"
                                    />
                                </TableCell>
                                <TableCell className="p-6 text-center">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex justify-center">
                                                    {order.saleUuid ? (
                                                        <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black uppercase px-2">
                                                            <CheckCircle2 className="h-2.5 w-2.5" /> Facturé
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground/30 text-[8px] font-black uppercase px-2 border-white/5">
                                                            Local
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {order.saleUuid ? "Intégré au grand livre" : "Enregistrement local uniquement"}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    {!order.saleUuid && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            aria-label="Supprimer"
                                            className="h-8 w-8 text-destructive/20 hover:text-destructive hover:bg-destructive/5"
                                            onClick={() => setOrderToDelete(order.uuid)}
                                        >
                                            <Trash2 className="h-4 w-4" />
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
