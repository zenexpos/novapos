'use client';

import React, { memo } from 'react';
import type { InventoryLog } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { 
    RefreshCcw, ShoppingCart, Undo2, Archive, 
    TriangleAlert, Hash, Clock
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

export const InventoryLogTable = memo(({ logs }: InventoryLogTableProps) => {
    return (
        <div className="rounded-lg border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none h-9">
                        <TableHead className="px-3 font-semibold text-[8px] uppercase text-muted-foreground/60 tracking-widest">Temps</TableHead>
                        <TableHead className="px-3 font-semibold text-[8px] uppercase text-muted-foreground/60 tracking-widest">Produit</TableHead>
                        <TableHead className="px-3 font-semibold text-[8px] uppercase text-muted-foreground/60 tracking-widest">Nature</TableHead>
                        <TableHead className="px-3 text-center font-semibold text-[8px] uppercase text-muted-foreground/60 tracking-widest">Flux</TableHead>
                        <TableHead className="px-3 text-center font-semibold text-[8px] uppercase text-primary tracking-widest">Stock</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center opacity-20 italic font-bold text-xs uppercase">Aucun log.</TableCell>
                        </TableRow>
                    ) : logs.map((log) => {
                        const config = reasonConfig[log.reason] || { label: log.reason, icon: TriangleAlert, color: '' };
                        const isPositive = log.change > 0;

                        return (
                            <TableRow key={log.uuid} className="group hover:bg-white/5 border-b border-white/5 transition-all duration-300 h-9">
                                <TableCell className="px-3 py-0 whitespace-nowrap">
                                    <div className="flex flex-col -space-y-1">
                                        <span className="font-bold text-[9px]">{format(new Date(log.createdAt), 'dd MMM', { locale: fr })}</span>
                                        <span className="text-[7px] text-muted-foreground/40 uppercase">{format(new Date(log.createdAt), 'HH:mm')}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-3 py-0">
                                    <span className="font-bold tracking-tight text-[10px] truncate max-w-[150px] block uppercase">{log.productName}</span>
                                </TableCell>
                                <TableCell className="px-3 py-0">
                                    <Badge variant="outline" className={cn("gap-0.5 px-1.5 py-0 rounded-md border font-black text-[7px] uppercase tracking-tighter", config.color)}>
                                        <config.icon className="h-2 w-2" />
                                        {config.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="px-3 py-0 text-center">
                                    <span className={cn("font-black text-[9px] tabular-nums", isPositive ? "text-emerald-500" : "text-red-500")}>
                                        {isPositive ? `+${log.change}` : log.change}
                                    </span>
                                </TableCell>
                                <TableCell className="px-3 py-0 text-center">
                                    <span className="font-mono font-black text-[10px] text-primary tabular-nums">
                                        {log.newQuantity}
                                    </span>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
});
InventoryLogTable.displayName = 'InventoryLogTable';
