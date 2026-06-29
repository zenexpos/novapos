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
        if (sortKey !== colKey) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-20" />;
        return sortOrder === 'asc' 
            ? <ChevronUp className="ml-2 h-3 w-3 text-primary" /> 
            : <ChevronDown className="ml-2 h-3 w-3 text-primary" />;
    };

    return (
        <div className="rounded-lg border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="w-[60px] px-6">
                           <Checkbox
                                checked={suppliers.length > 0 && selectedSuppliers.size === suppliers.length}
                                onCheckedChange={onToggleSelectAll}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="p-6">
                            <button onClick={() => handleSort('name')} className="flex items-center text-[10px] font-black uppercase text-muted-foreground/60 hover:text-primary transition-colors">
                                Partenaire <SortIcon colKey="name" />
                            </button>
                        </TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Contact Elite</TableHead>
                        <TableHead className="p-6 text-right">
                            <button onClick={() => handleSort('balance')} className="flex items-center justify-end w-full text-[10px] font-black uppercase text-destructive hover:text-primary transition-colors">
                                Solde Dû <SortIcon colKey="balance" />
                            </button>
                        </TableHead>
                        <TableHead className="p-6 w-[150px] text-right font-semibold text-[10px] uppercase text-muted-foreground/60">Gestion</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedSuppliers.map((supplier) => {
                        const isSelected = selectedSuppliers.has(supplier.uuid);
                        return (
                            <TableRow 
                                key={supplier.uuid} 
                                onClick={() => onToggleSupplierSelection(supplier.uuid)}
                                className={cn(
                                    "group transition-all border-b border-white/5 cursor-pointer",
                                    isSelected ? "bg-primary/10" : "hover:bg-primary/5"
                                )}
                            >
                                <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => onToggleSupplierSelection(supplier.uuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
                                            <Building className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col -space-y-0.5">
                                            <span className="font-semibold text-base tracking-tighter group-hover:text-primary transition-colors">{supplier.name}</span>
                                            <Link href={`/stock/suppliers/detail?uuid=${supplier.uuid}`} className="text-[9px] font-semibold uppercase text-muted-foreground/40 tracking-wide flex items-center gap-1 hover:text-primary/60 transition-colors">
                                                Dossier Complet <ChevronRight className="h-2.5 w-2.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex flex-col -space-y-0.5">
                                        <span className="text-sm font-bold tracking-tight">{supplier.contactPerson || 'Non spécifié'}</span>
                                        {supplier.phone && (
                                            <span className="text-[10px] font-mono font-bold text-muted-foreground/50 flex items-center gap-1.5 mt-1">
                                                <Phone className="h-3 w-3 text-primary/40" /> {supplier.phone}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    <div className={cn(
                                        "inline-flex items-center justify-center px-5 py-2 rounded-2xl font-mono font-semibold text-sm shadow-sm border transition-all duration-500",
                                        supplier.balance > 0 
                                            ? "bg-destructive/5 text-destructive border-destructive/20 group-hover:bg-destructive/10" 
                                            : "bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
                                    )}>
                                        {formatCurrency(supplier.balance)}
                                    </div>
                                </TableCell>
                                <TableCell className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-10 w-10 rounded-xl border-white/5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
                                            onClick={() => onPay(supplier)}
                                            disabled={supplier.balance <= 0}
                                        >
                                            <HandCoins className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-10 w-10 rounded-xl border-white/5 bg-background/50 hover:bg-primary/10 transition-all shadow-lg"
                                            onClick={() => onEdit(supplier)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-10 w-10 rounded-xl border-white/5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-lg"
                                            onClick={() => onDelete(supplier)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {suppliers.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="p-24 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-20">
                                    <Building className="h-16 w-16" />
                                    <p className="text-[10px] font-semibold uppercase ">Annuaire vide</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}