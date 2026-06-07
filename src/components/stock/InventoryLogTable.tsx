'use client';

import React from 'react';
import type { InventoryLog } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, ShoppingCart, Undo2, Archive, AlertTriangle, Hash, Clock, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryLogTableProps {
    logs: (InventoryLog & { productName: string, reference?: string })[];
}

const reasonConfig: Record<string, { label: string, icon: React.ElementType, color: string }> = {
    'sale': { label: 'Vente', icon: ShoppingCart, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    'return': { label: 'Retour', icon: Undo2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    'stock_intake': { label: 'Réception', icon: Archive, color: 'text-primary bg-primary/10 border-primary/20' },
    'cancellation': { label: 'Annulation', icon: RefreshCcw, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
    'manual_adjustment': { label: 'Ajustement', icon: AlertTriangle, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
};

export function InventoryLogTable({ logs }: InventoryLogTableProps) {
    return (
        <div className="rounded-lg border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Horodatage</TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Désignation Produit</TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Nature Flux</TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Référence</TableHead>
                        <TableHead className="p-6 text-center font-semibold text-[10px] uppercase text-muted-foreground/60">Variation</TableHead>
                        <TableHead className="p-6 text-center font-semibold text-[10px] uppercase text-primary">Solde Elite</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => {
                        const config = reasonConfig[log.reason] || { label: log.reason, icon: AlertTriangle, color: '' };
                        const isPositive = log.change > 0;

                        return (
                            <TableRow key={log.uuid} className="group hover:bg-white/5 border-b border-white/5 transition-all duration-300">
                                <TableCell className="p-6 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-black/20 text-muted-foreground/40 shadow-inner">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col -space-y-0.5">
                                            <span className="font-bold text-xs">{format(new Date(log.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                                            <span className="text-[9px] text-muted-foreground/40 uppercase font-semibold tracking-wide">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/5 text-primary/40">
                                            <Package className="h-4 w-4" />
                                        </div>
                                        <span className="font-semibold tracking-tight text-sm group-hover:text-primary transition-colors">{log.productName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <Badge variant="outline" className={cn("gap-2 px-3 py-1.5 rounded-xl border font-semibold text-[9px] uppercase tracking-wide shadow-sm", config.color)}>
                                        <config.icon className="h-3.5 w-3.5" />
                                        {config.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="p-6">
                                    {log.reference ? (
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground/60 bg-muted/20 px-3 py-1.5 rounded-xl w-fit border border-white/5">
                                            <Hash className="h-3 w-3 opacity-30" />
                                            {log.reference}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground/20 italic">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="p-6 text-center">
                                    <div className={cn(
                                        "inline-flex items-center gap-1 font-semibold text-sm px-4 py-1.5 rounded-full shadow-inner",
                                        isPositive ? "text-emerald-500 bg-emerald-500/5" : "text-destructive bg-destructive/5"
                                    )}>
                                        {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                                        {isPositive ? `+${log.change}` : log.change}
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-center">
                                    <div className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-black/40 border border-white/5 font-mono font-semibold text-sm shadow-sm text-primary min-w-[70px]">
                                        {log.newQuantity}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
