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
        if (sortKey !== colKey) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-20" />;
        return sortOrder === 'asc' ? <ChevronUp className="ml-2 h-3 w-3 text-primary" /> : <ChevronDown className="ml-2 h-3 w-3 text-primary" />;
    };

    return (
        <div className="rounded-lg border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="p-6">
                            <button onClick={() => handleSort('supplier')} className="flex items-center text-[10px] font-black uppercase text-muted-foreground/60 hover:text-primary transition-colors">
                                Fournisseur <SortIcon colKey="supplier" />
                            </button>
                        </TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Identifiant Bon</TableHead>
                        <TableHead className="p-6">
                            <button onClick={() => handleSort('date')} className="flex items-center justify-center w-full text-[10px] font-black uppercase text-muted-foreground/60 hover:text-primary transition-colors">
                                Date <SortIcon colKey="date" />
                            </button>
                        </TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60 text-center">Volume</TableHead>
                        <TableHead className="p-6 text-right">
                            <button onClick={() => handleSort('total')} className="flex items-center justify-end w-full text-[10px] font-black uppercase text-primary hover:text-primary transition-colors">
                                Valeur Elite <SortIcon colKey="total" />
                            </button>
                        </TableHead>
                        <TableHead className="p-6 w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedIntakes.map(intake => {
                        const supplierName = intake.supplierUuid ? supplierMap.get(intake.supplierUuid)?.name : 'Partenaire Inconnu';
                        return (
                            <TableRow key={intake.uuid} className="group hover:bg-primary/5 border-b border-white/5 transition-all duration-300">
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shadow-inner">
                                            <Building className="h-4 w-4" />
                                        </div>
                                        <span className="font-semibold text-sm tracking-tight group-hover:text-primary transition-colors">{supplierName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground/60">
                                        <Hash className="h-3 w-3 opacity-30" />
                                        {intake.invoiceNumber || 'No Ref'}
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-center">
                                    <span className="text-xs font-bold">{format(safeToDate(intake.createdAt!), 'dd MMM yyyy', { locale: fr })}</span>
                                </TableCell>
                                <TableCell className="p-6 text-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-muted/50 border border-white/5 shadow-inner">
                                        <ShoppingBag className="h-3 w-3 opacity-30" />
                                        <span className="text-xs font-semibold">{intake.items.length}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    <span className="text-base font-semibold text-primary tracking-tighter font-mono">{formatCurrency(intake.totalValue)}</span>
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted group-hover:bg-background/50 transition-all">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-sm bg-card">
                                            <DropdownMenuItem onClick={() => onViewDetails(intake)} className="rounded-xl p-3">
                                                <FileText className="mr-2 h-4 w-4" /> Voir détails
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onCancelIntake(intake)} className="text-destructive focus:text-destructive rounded-xl p-3">
                                                <Trash2 className="mr-2 h-4 w-4" /> Annuler réception
                                            </DropdownMenuItem>
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
