'use client';

import React, { useState, memo } from 'react';
import type { StockIntake, Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, FileText, Trash2, Hash, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StockIntakeTableProps {
    intakes: StockIntake[];
    supplierMap: Map<string, Supplier>;
    onViewDetails: (intake: StockIntake) => void;
    onCancelIntake: (intake: StockIntake) => void;
}

type SortKey = 'date' | 'total' | 'supplier';
type SortOrder = 'asc' | 'desc';

export const StockIntakeTable = memo(({ intakes, supplierMap, onViewDetails, onCancelIntake }: StockIntakeTableProps) => {
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const sortedIntakes = [...intakes].sort((a, b) => {
        if (sortKey === 'date') {
            const da = safeToDate(a.createdAt!).getTime();
            const db = safeToDate(b.createdAt!).getTime();
            return sortOrder === 'asc' ? da - db : db - da;
        }
        if (sortKey === 'total') {
            return sortOrder === 'asc' ? a.totalValue - b.totalValue : b.totalValue - a.totalValue;
        }
        if (sortKey === 'supplier') {
            const na = supplierMap.get(a.supplierUuid || '')?.name || '';
            const nb = supplierMap.get(b.supplierUuid || '')?.name || '';
            return sortOrder === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
        }
        return 0;
    });

    const SortIcon = ({ colKey }: { colKey: SortKey }) => {
        if (sortKey !== colKey) return <ChevronsUpDown className="ml-1 h-2 w-2 opacity-20" />;
        return sortOrder === 'asc' ? <ChevronUp className="ml-1 h-2 w-2 text-primary" /> : <ChevronDown className="ml-1 h-2 w-2 text-primary" />;
    };

    return (
        <div className="rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow className="border-none h-9">
                        <TableHead className="px-3">
                            <button onClick={() => handleSort('supplier')} className="flex items-center text-[9px] font-black uppercase text-muted-foreground/60 hover:text-primary transition-colors tracking-widest">
                                FOURNISSEUR <SortIcon colKey="supplier" />
                            </button>
                        </TableHead>
                        <TableHead className="px-3 text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">RÉF</TableHead>
                        <TableHead className="px-3 text-center">
                            <button onClick={() => handleSort('date')} className="flex items-center justify-center w-full text-[9px] font-black uppercase text-muted-foreground/60 hover:text-primary transition-colors tracking-widest">
                                DATE <SortIcon colKey="date" />
                            </button>
                        </TableHead>
                        <TableHead className="px-3 text-right">
                            <button onClick={() => handleSort('total')} className="flex items-center justify-end w-full text-[9px] font-black uppercase text-primary hover:text-primary transition-colors tracking-widest">
                                VALEUR <SortIcon colKey="total" />
                            </button>
                        </TableHead>
                        <TableHead className="w-[50px] px-2"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedIntakes.map(intake => {
                        const supplierName = intake.supplierUuid ? supplierMap.get(intake.supplierUuid)?.name : 'Passage';
                        return (
                            <TableRow key={intake.uuid} className="group hover:bg-muted/30 border-b border-white/5 transition-all h-9 cursor-pointer" onClick={() => onViewDetails(intake)}>
                                <TableCell className="px-3 py-0">
                                    <span className="font-bold text-[10px] uppercase truncate max-w-[120px] block">{supplierName}</span>
                                </TableCell>
                                <TableCell className="px-3 py-0">
                                    <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-muted-foreground/40">
                                        <Hash className="h-2 w-2 opacity-20" />
                                        {intake.invoiceNumber?.slice(-6) || '—'}
                                    </div>
                                </TableCell>
                                <TableCell className="px-3 py-0 text-center">
                                    <span className="text-[9px] font-bold opacity-60">{format(safeToDate(intake.createdAt!), 'dd MMM yy', { locale: fr })}</span>
                                </TableCell>
                                <TableCell className="px-3 py-0 text-right">
                                    <span className="font-black text-[10px] text-primary tabular-nums tracking-tighter">{formatCurrency(intake.totalValue)}</span>
                                </TableCell>
                                <TableCell className="px-2 py-0 text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-6 w-6 flex items-center justify-center rounded-md opacity-20 group-hover:opacity-100 hover:bg-muted transition-all">
                                                <MoreHorizontal className="h-3 w-3" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-white/5">
                                            <DropdownMenuItem onClick={() => onViewDetails(intake)} className="text-xs font-bold p-2"><FileText className="mr-2 h-3.5 w-3.5" /> Examiner</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onCancelIntake(intake)} className="text-destructive text-xs font-bold p-2"><Trash2 className="mr-2 h-3.5 w-3.5" /> Annuler</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
});
StockIntakeTable.displayName = 'StockIntakeTable';