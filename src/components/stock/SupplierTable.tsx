'use client';

import React, { useState } from 'react';
import type { Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { HandCoins, Edit, Trash2, Phone, Building, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface SupplierTableProps {
    suppliers: Supplier[];
    onPay: (supplier: Supplier) => void;
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
    selectedSuppliers: Set<string>;
    onToggleSupplierSelection: (uuid: string) => void;
    onToggleSelectAll: () => void;
}

type SortKey = 'name' | 'balance';
type SortOrder = 'asc' | 'desc';

export function SupplierTable({ 
    suppliers, 
    onPay, 
    onEdit, 
    onDelete, 
    selectedSuppliers, 
    onToggleSupplierSelection, 
    onToggleSelectAll 
}: SupplierTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const sortedSuppliers = [...suppliers].sort((a, b) => {
        if (sortKey === 'name') {
            return sortOrder === 'asc' 
                ? a.name.localeCompare(b.name) 
                : b.name.localeCompare(a.name);
        }
        if (sortKey === 'balance') {
            return sortOrder === 'asc' 
                ? a.balance - b.balance 
                : b.balance - a.balance;
        }
        return 0;
    });

    const SortIcon = ({ colKey }: { colKey: SortKey }) => {
        if (sortKey !== colKey) return <ChevronsUpDown className="ml-1 h-2.5 w-2.5 opacity-20" />;
        return sortOrder === 'asc' 
            ? <ChevronUp className="ml-1 h-2.5 w-2.5 text-primary" /> 
            : <ChevronDown className="ml-1 h-2.5 w-2.5 text-primary" />;
    };

    return (
        <div className="rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow className="border-none h-10">
                        <TableHead className="w-[50px] px-4">
                           <Checkbox
                                checked={suppliers.length > 0 && selectedSuppliers.size === suppliers.length}
                                onCheckedChange={onToggleSelectAll}
                                className="h-3.5 w-3.5 border-primary data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="px-2">
                            <button onClick={() => handleSort('name')} className="flex items-center text-[9px] font-black uppercase text-muted-foreground/60 hover:text-primary transition-colors tracking-widest">
                                Partenaire <SortIcon colKey="name" />
                            </button>
                        </TableHead>
                        <TableHead className="px-2 text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Contact Elite</TableHead>
                        <TableHead className="px-2 text-right">
                            <button onClick={() => handleSort('balance')} className="flex items-center justify-end w-full text-[9px] font-black uppercase text-destructive hover:text-primary transition-colors tracking-widest">
                                Solde Dû <SortIcon colKey="balance" />
                            </button>
                        </TableHead>
                        <TableHead className="w-[120px] px-4"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedSuppliers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-40 text-center opacity-20 italic font-bold">Aucun fournisseur trouvé.</TableCell>
                        </TableRow>
                    ) : sortedSuppliers.map((supplier) => {
                        const isSelected = selectedSuppliers.has(supplier.uuid);
                        return (
                            <TableRow 
                                key={supplier.uuid} 
                                onClick={() => onToggleSupplierSelection(supplier.uuid)}
                                className={cn(
                                    "group transition-all border-b border-white/5 cursor-pointer h-10",
                                    isSelected ? "bg-primary/10" : "hover:bg-muted/30"
                                )}
                            >
                                <TableCell className="px-4 py-0" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => onToggleSupplierSelection(supplier.uuid)}
                                        className="h-3.5 w-3.5 border-primary/40 data-[state=checked]:bg-primary"
                                    />
                                </TableCell>
                                <TableCell className="px-2 py-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shadow-inner">
                                            <Building className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex flex-col -space-y-0.5 min-w-0">
                                            <span className="font-bold text-[11px] truncate uppercase tracking-tight">{supplier.name}</span>
                                            <Link href={`/stock/suppliers/detail?uuid=${supplier.uuid}`} className="text-[8px] font-semibold uppercase text-muted-foreground/40 hover:text-primary/60 transition-colors flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                Dossier <ChevronRight className="h-2 w-2" />
                                            </Link>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="px-2 py-0">
                                    <div className="flex flex-col -space-y-1">
                                        <span className="text-[10px] font-bold">{supplier.contactPerson || '—'}</span>
                                        {supplier.phone && (
                                            <span className="text-[8px] font-mono text-muted-foreground/40 flex items-center gap-1">
                                                <Phone className="h-2 w-2" /> {supplier.phone}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="px-2 py-0 text-right">
                                    <span className={cn(
                                        "font-mono font-black text-[11px] tabular-nums",
                                        supplier.balance > 0.01 ? "text-destructive" : "text-emerald-600"
                                    )}>
                                        {formatCurrency(supplier.balance)}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-0 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" 
                                            size="icon-sm" 
                                            className="h-7 w-7 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                                            onClick={() => onPay(supplier)}
                                            disabled={supplier.balance <= 0.01}
                                        >
                                            <HandCoins className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon-sm" 
                                            className="h-7 w-7 rounded-lg text-primary hover:bg-primary/10"
                                            onClick={() => onEdit(supplier)}
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon-sm" 
                                            className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                                            onClick={() => onDelete(supplier)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
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
