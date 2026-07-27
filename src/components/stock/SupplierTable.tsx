'use client';

import React, { useState, memo } from 'react';
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

export const SupplierTable = memo(({ 
    suppliers, 
    onPay, 
    onEdit, 
    onDelete, 
    selectedSuppliers, 
    onToggleSupplierSelection, 
    onToggleSelectAll 
}: SupplierTableProps) => {
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
        if (sortKey !== colKey) return <ChevronsUpDown className="ml-1 h-2 w-2 opacity-20" />;
        return sortOrder === 'asc' 
            ? <ChevronUp className="ml-1 h-2 w-2 text-primary" /> 
            : <ChevronDown className="ml-1 h-2 w-2 text-primary" />;
    };

    return (
        <div className="rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow className="border-none h-9">
                        <TableHead className="w-[40px] px-2">
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
                        <TableHead className="px-2 text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Contact</TableHead>
                        <TableHead className="px-2 text-right">
                            <button onClick={() => handleSort('balance')} className="flex items-center justify-end w-full text-[9px] font-black uppercase text-destructive hover:text-primary transition-colors tracking-widest">
                                Solde <SortIcon colKey="balance" />
                            </button>
                        </TableHead>
                        <TableHead className="w-[100px] px-2"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedSuppliers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center opacity-20 italic font-bold text-xs uppercase">Vide.</TableCell>
                        </TableRow>
                    ) : sortedSuppliers.map((supplier) => {
                        const isSelected = selectedSuppliers.has(supplier.uuid);
                        return (
                            <TableRow 
                                key={supplier.uuid} 
                                onClick={() => onToggleSupplierSelection(supplier.uuid)}
                                className={cn(
                                    "group transition-all border-b border-white/5 cursor-pointer h-9",
                                    isSelected ? "bg-primary/10" : "hover:bg-muted/30"
                                )}
                            >
                                <TableCell className="px-2 py-0" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => onToggleSupplierSelection(supplier.uuid)}
                                        className="h-3 w-3 border-primary/40"
                                    />
                                </TableCell>
                                <TableCell className="px-2 py-0">
                                    <div className="flex flex-col -space-y-0.5">
                                        <span className="font-bold text-[10px] truncate uppercase tracking-tight">{supplier.name}</span>
                                        <Link href={`/stock/suppliers/detail?uuid=${supplier.uuid}`} className="text-[7px] font-black uppercase text-primary/30 hover:text-primary transition-colors flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                            Dossier <ChevronRight className="h-1.5 w-1.5" />
                                        </Link>
                                    </div>
                                </TableCell>
                                <TableCell className="px-2 py-0">
                                    <span className="text-[9px] font-bold opacity-40">{supplier.phone || '—'}</span>
                                </TableCell>
                                <TableCell className="px-2 py-0 text-right">
                                    <span className={cn(
                                        "font-mono font-black text-[10px] tabular-nums",
                                        supplier.balance > 0.01 ? "text-red-500" : "text-emerald-600"
                                    )}>
                                        {formatCurrency(supplier.balance)}
                                    </span>
                                </TableCell>
                                <TableCell className="px-2 py-0 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            className="h-6 w-6 flex items-center justify-center rounded-md text-emerald-500 hover:bg-emerald-500/10"
                                            onClick={() => onPay(supplier)}
                                            disabled={supplier.balance <= 0.01}
                                        >
                                            <HandCoins className="h-3 w-3" />
                                        </button>
                                        <button 
                                            className="h-6 w-6 flex items-center justify-center rounded-md text-primary hover:bg-primary/10"
                                            onClick={() => onEdit(supplier)}
                                        >
                                            <Edit className="h-3 w-3" />
                                        </button>
                                        <button 
                                            className="h-6 w-6 flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                                            onClick={() => onDelete(supplier)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
});
SupplierTable.displayName = 'SupplierTable';
