'use client';

import React, { useState } from 'react';
import type { StockIntake, Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Hash, Clock, Building, ShoppingBag, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StockIntakeTableProps {
    intakes: StockIntake[];
    supplierMap: Map<string, Supplier>;
    onViewDetails: (intake: StockIntake) => void;
    onCancelIntake: (intake: StockIntake) => void;
}

type SortKey = 'date' | 'total' | 'supplier';
type SortOrder = 'asc' | 'desc';

export function StockIntakeTable({ intakes, supplierMap, onViewDetails, onCancelIntake }: StockIntakeTableProps) {
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
        if (sortKey !== colKey) return <ChevronsUpDown className="ml-1 h-2.5 w-2.5 opacity-20" />;
        return sortOrder === 'asc' ? <ChevronUp className="ml-1 h-2.5 w-2.5 text-primary" /> : <ChevronDown className="ml-1 h-2.5 w-2.5 text-primary" />;
    };

    return (
        <div className="rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow className="border-none h-10">
                        <TableHead className="px-4">
                            <button onClick={() => handleSort('supplier')} className="flex items-center text-[9px] font-black uppercase text-muted-foreground/60 hover:text-primary transition-colors tracking-widest">
                                Fournisseur <SortIcon colKey="supplier" />
                            </button>
                        </TableHead>
                        <TableHead className="px-4 text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Référence</TableHead>
                        <TableHead className="px-4 text-center">
                            <button onClick={() => handleSort('date')} className="flex items-center justify-center w-full text-[9px] font-black uppercase text-muted-foreground/60 hover:text-primary transition-colors tracking-widest">
                                Date <SortIcon colKey="date" />
                            </button>
                        </TableHead>
                        <TableHead className="px-4 text-[9px] font-black uppercase text-muted-foreground/60 text-center tracking-widest">Volume</TableHead>
                        <TableHead className="px-4 text-right">
                            <button onClick={() => handleSort('total')} className="flex items-center justify-end w-full text-[9px] font-black uppercase text-primary hover:text-primary transition-colors tracking-widest">
                                Valeur <SortIcon colKey="total" />
                            </button>
                        </TableHead>
                        <TableHead className="w-[60px] px-4"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedIntakes.map(intake => {
                        const supplierName = intake.supplierUuid ? supplierMap.get(intake.supplierUuid)?.name : 'Passage';
                        return (
                            <TableRow key={intake.uuid} className="group hover:bg-muted/30 border-b border-white/5 transition-all h-10 cursor-pointer" onClick={() => onViewDetails(intake)}>
                                <TableCell className="px-4 py-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shadow-inner">
                                            <Building className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="font-bold text-[11px] uppercase tracking-tight truncate max-w-[150px]">{supplierName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-0">
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-muted-foreground/50">
                                        <Hash className="h-2.5 w-2.5 opacity-30" />
                                        {intake.invoiceNumber || '—'}
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-0 text-center">
                                    <span className="text-[10px] font-bold">{format(safeToDate(intake.createdAt!), 'dd MMM yy', { locale: fr })}</span>
                                </TableCell>
                                <TableCell className="px-4 py-0 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted/50 border border-white/5 text-[9px] font-black">
                                        <ShoppingBag className="h-2.5 w-2.5 opacity-30" />
                                        {intake.items.length}
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-0 text-right">
                                    <span className="font-black text-[11px] text-primary tabular-nums tracking-tighter">{formatCurrency(intake.totalValue)}</span>
                                </TableCell>
                                <TableCell className="px-4 py-0 text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon-sm" className="h-7 w-7 rounded-md opacity-20 group-hover:opacity-100 hover:bg-muted transition-all">
                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                            </Button>
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
}
