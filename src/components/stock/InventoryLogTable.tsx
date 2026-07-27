'use client';

import React from 'react';
import type { InventoryLog } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { 
    RefreshCcw, ShoppingCart, Undo2, Archive, 
    TriangleAlert, Hash, Clock, Package,
    ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryLogTableProps {
    logs: (InventoryLog & { productName: string, reference?: string })[];
}

const reasonConfig: Record<string, { label: string, icon: React.ElementType, color: string }> = {
    'sale': { label: 'Vente', icon: ShoppingCart, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    'return': { label: 'Retour', icon: Undo2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    'stock_intake': { label: 'Réception', icon: Archive, color: 'text-primary bg-primary/10 border-primary/20' },
    'cancellation': { label: 'Annulation', icon: RefreshCcw, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
    'manual_adjustment': { label: 'Ajustement', icon: TriangleAlert, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
};

export function InventoryLogTable({ logs }: InventoryLogTableProps) {
    return (
        <div className="rounded-lg border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none h-10">
                        <TableHead className="px-4 font-semibold text-[9px] uppercase text-muted-foreground/60 tracking-widest">Horodatage</TableHead>
                        <TableHead className="px-4 font-semibold text-[9px] uppercase text-muted-foreground/60 tracking-widest">Désignation Produit</TableHead>
                        <TableHead className="px-4 font-semibold text-[9px] uppercase text-muted-foreground/60 tracking-widest">Nature Flux</TableHead>
                        <TableHead className="px-4 font-semibold text-[9px] uppercase text-muted-foreground/60 tracking-widest">Référence</TableHead>
                        <TableHead className="px-4 text-center font-semibold text-[9px] uppercase text-muted-foreground/60 tracking-widest">Variation</TableHead>
                        <TableHead className="px-4 text-center font-semibold text-[9px] uppercase text-primary tracking-widest">Solde Elite</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-40 text-center opacity-20 italic font-bold">Aucun mouvement de stock.</TableCell>
                        </TableRow>
                    ) : logs.map((log) => {
                        const config = reasonConfig[log.reason] || { label: log.reason, icon: TriangleAlert, color: '' };
                        const isPositive = log.change > 0;

                        return (
                            <TableRow key={log.uuid} className="group hover:bg-white/5 border-b border-white/5 transition-all duration-300 h-10">
                                <TableCell className="px-4 py-0 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded-lg bg-black/20 text-muted-foreground/40 shadow-inner">
                                            <Clock className="h-3 w-3" />
                                        </div>
                                        <div className="flex flex-col -space-y-1">
                                            <span className="font-bold text-[10px]">{format(new Date(log.createdAt), 'dd MMM yy', { locale: fr })}</span>
                                            <span className="text-[8px] text-muted-foreground/40 uppercase font-semibold">{format(new Date(log.createdAt), 'HH:mm')}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-0">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded-lg bg-primary/5 text-primary/40">
                                            <Package className="h-3 w-3" />
                                        </div>
                                        <span className="font-bold tracking-tight text-[11px] group-hover:text-primary transition-colors truncate max-w-[150px] uppercase">{log.productName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-0">
                                    <Badge variant="outline" className={cn("gap-1 px-2 py-0.5 rounded-lg border font-black text-[8px] uppercase tracking-tighter shadow-sm", config.color)}>
                                        <config.icon className="h-2.5 w-2.5" />
                                        {config.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="px-4 py-0">
                                    {log.relatedUuid || log.reference ? (
                                        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-muted-foreground/60 bg-muted/20 px-2 py-0.5 rounded-lg w-fit border border-white/5">
                                            <Hash className="h-2.5 w-2.5 opacity-30" />
                                            {(log.reference || log.relatedUuid?.substring(0,8) || '—')}
                                        </div>
                                    ) : (
                                        <span className="text-[8px] text-muted-foreground/20 italic">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="px-4 py-0 text-center">
                                    <div className={cn(
                                        "inline-flex items-center gap-0.5 font-black text-[10px] px-2 py-0.5 rounded-full shadow-inner",
                                        isPositive ? "text-emerald-500 bg-emerald-500/5" : "text-destructive bg-destructive/5"
                                    )}>
                                        {isPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownLeft className="h-2.5 w-2.5" />}
                                        {isPositive ? `+${log.change}` : log.change}
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-0 text-center">
                                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-black/40 border border-white/5 font-mono font-black text-[10px] shadow-sm text-primary min-w-[50px] tabular-nums">
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
