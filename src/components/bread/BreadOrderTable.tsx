'use client';

import React from 'react';
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
    CloudUpload
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { breadService } from '@/services/bread.service';
import { toast } from 'sonner';
import { ConfirmAlertDialog } from '../ui/ConfirmAlertDialog';
import { useState } from 'react';

interface BreadOrderTableProps {
    orders: BreadOrderWithCustomer[];
}

export function BreadOrderTable({ orders }: BreadOrderTableProps) {
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    const handleTogglePickup = async (order: BreadOrderWithCustomer) => {
        const newState = !order.isDelivered;
        await breadService.updateBreadOrderDeliveryStatus(order.uuid, newState);
        toast.success(newState ? 'Article livré' : 'Livraison annulée');
    };

    const handleDelete = async () => {
        if (!orderToDelete) return;
        try {
            await breadService.deleteBreadOrder(orderToDelete);
            toast.success("Commande supprimée.");
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setOrderToDelete(null);
        }
    };

    return (
        <>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/50 border-b border-white/5">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[120px] p-4 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Ref</TableHead>
                        <TableHead className="p-4 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Client</TableHead>
                        <TableHead className="p-4 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest text-center">Quantité</TableHead>
                        <TableHead className="p-4 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest text-right">Total</TableHead>
                        <TableHead className="p-4 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest text-center">Paiement</TableHead>
                        <TableHead className="p-4 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest text-center">Livraison</TableHead>
                        <TableHead className="p-4 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest text-center">Compte</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-60 text-center opacity-20 italic">Aucune commande trouvée.</TableCell>
                        </TableRow>
                    ) : orders.map((order) => (
                        <TableRow key={order.uuid} className="group border-b border-white/5 hover:bg-primary/5 transition-all">
                            <TableCell className="p-4">
                                <div className="flex items-center gap-2">
                                    <Hash className="h-3 w-3 opacity-30" />
                                    <span className="font-mono text-[10px] font-bold tracking-tighter">{order.orderNumber}</span>
                                </div>
                            </TableCell>
                            <TableCell className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                        <User className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-bold text-sm tracking-tight">{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : (order.customName || 'Passage')}</span>
                                </div>
                            </TableCell>
                            <TableCell className="p-4 text-center">
                                <Badge variant="outline" className="rounded-xl font-bold bg-muted/20 px-3">
                                    {order.quantity} pcs
                                </Badge>
                            </TableCell>
                            <TableCell className="p-4 text-right font-black text-sm tabular-nums">
                                {formatCurrency(order.totalAmount)}
                            </TableCell>
                            <TableCell className="p-4 text-center">
                                <Badge className={cn(
                                    "text-[8px] font-black uppercase px-2 py-0.5 border-none",
                                    order.venteUuid ? "bg-emerald-500 text-white" : "bg-destructive text-white"
                                )}>
                                    {order.venteUuid ? 'Vendu' : 'En attente'}
                                </Badge>
                            </TableCell>
                            <TableCell className="p-4 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Badge className={cn(
                                        "text-[8px] font-black uppercase px-2 py-0.5 border-none",
                                        order.isDelivered ? "bg-emerald-500 text-white" : "bg-destructive text-white"
                                    )}>
                                        {order.isDelivered ? 'Livré' : 'À livrer'}
                                    </Badge>
                                    <Switch 
                                        checked={order.isDelivered} 
                                        onCheckedChange={() => handleTogglePickup(order)}
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                </div>
                            </TableCell>
                            <TableCell className="p-4 text-center">
                                {order.transferredToCustomerAccount ? (
                                    <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20 text-[8px] font-black uppercase px-2">
                                        <CloudUpload className="h-2.5 w-2.5" /> Transféré
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground/30 text-[8px] font-black uppercase px-2">
                                        Local
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="p-4 text-right">
                                {!order.venteUuid && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive/20 hover:text-destructive hover:bg-destructive/5"
                                        onClick={() => setOrderToDelete(order.uuid)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        <ConfirmAlertDialog 
            isOpen={!!orderToDelete}
            onOpenChange={(open) => !open && setOrderToDelete(null)}
            title="Supprimer la commande ?"
            description="Cette action est irréversible."
            onConfirm={handleDelete}
            confirmText="Supprimer"
        />
        </>
    );
}
