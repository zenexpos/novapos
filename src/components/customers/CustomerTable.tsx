'use client';

import React, { useState, useMemo } from 'react';
import type { Customer } from '@/lib/types';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal, Edit, Trash2, FileText,
    Wheat, ChevronUp, ChevronDown,
    ChevronsUpDown, Clock, CheckCircle2,
    TriangleAlert
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatCurrency, safeNumber } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

interface CustomerTableProps {
    customers: Customer[];
    onEdit:   (c: Customer) => void;
    onDelete: (c: Customer) => void;
    selectedCustomers: Set<string>;
    onToggleSelection: (uuid: string) => void;
    onToggleSelectAll: () => void;
}

type SortKey = 'name' | 'spent' | 'balance';
type SortDir = 'asc' | 'desc';

export function CustomerTable({
    customers, onEdit, onDelete,
    selectedCustomers, onToggleSelection, onToggleSelectAll,
}: CustomerTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const sorted = useMemo(() => {
        return [...customers].sort((a, b) => {
            let va: any, vb: any;
            if (sortKey === 'name') {
                va = `${a.firstName} ${a.lastName}`.toLowerCase();
                vb = `${b.firstName} ${b.lastName}`.toLowerCase();
                return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            }
            va = safeNumber(sortKey === 'spent' ? a.totalSpent : a.outstandingBalance);
            vb = safeNumber(sortKey === 'spent' ? b.totalSpent : b.outstandingBalance);
            return sortDir === 'asc' ? va - vb : vb - va;
        });
    }, [customers, sortKey, sortDir]);

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (col !== sortKey) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-20" />;
        return sortDir === 'asc' ? <ChevronUp className="ml-1 h-3 w-3 text-primary" /> : <ChevronDown className="ml-1 h-3 w-3 text-primary" />;
    };

    return (
        <div className="rounded-xl border bg-card/30 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-b h-8">
                        <TableHead className="w-10 px-4">
                            <Checkbox checked={customers.length > 0 && selectedCustomers.size === customers.length} onCheckedChange={onToggleSelectAll}
                                className="h-3.5 w-3.5 border-primary/40 data-[state=checked]:bg-primary" />
                        </TableHead>
                        <TableHead className="px-2">
                            <button onClick={() => toggleSort('name')} className="flex items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Client <SortIcon col="name" />
                            </button>
                        </TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 hidden md:table-cell">Contact</TableHead>
                        <TableHead className="px-2 text-right">
                            <button onClick={() => toggleSort('spent')} className="flex items-center justify-end w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Dépensé <SortIcon col="spent" />
                            </button>
                        </TableHead>
                        <TableHead className="px-2 text-right">
                            <button onClick={() => toggleSort('balance')} className="flex items-center justify-end w-full text-[9px] font-black uppercase tracking-widest text-primary">
                                Solde Dû <SortIcon col="balance" />
                            </button>
                        </TableHead>
                        <TableHead className="w-10 px-4" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map(c => {
                        const balance = safeNumber(c.outstandingBalance);
                        const isSelected = selectedCustomers.has(c.uuid);
                        const isOverdue = c.debtStatus === 'overdue';

                        return (
                            <TableRow key={c.uuid} onClick={() => onToggleSelection(c.uuid)} className={cn('group border-b cursor-pointer h-9', isSelected ? 'bg-primary/5' : 'hover:bg-muted/30')}>
                                <TableCell className="px-4 py-0" onClick={e => e.stopPropagation()}>
                                    <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection(c.uuid)} className="h-3.5 w-3.5 border-primary/40" />
                                </TableCell>
                                <TableCell className="px-2 py-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-[11px] uppercase truncate max-w-[200px]">{c.firstName} {c.lastName}</span>
                                        {c.isBreadClient && <Wheat className="h-2.5 w-2.5 text-primary/40 shrink-0" />}
                                    </div>
                                </TableCell>
                                <TableCell className="px-2 py-0 hidden md:table-cell">
                                    <span className="text-[10px] font-medium text-muted-foreground/50">{c.phone || '—'}</span>
                                </TableCell>
                                <TableCell className="px-2 py-0 text-right">
                                    <span className="font-mono text-[11px] text-muted-foreground/40">{formatCurrency(c.totalSpent)}</span>
                                </TableCell>
                                <TableCell className="px-2 py-0 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className={cn('font-mono text-[11px] font-black tabular-nums', balance > 0.009 ? 'text-red-500' : 'text-emerald-600')}>{formatCurrency(balance)}</span>
                                        {isOverdue && <TriangleAlert className="h-3 w-3 text-red-500 animate-pulse" />}
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-0 text-right" onClick={e => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"><MoreHorizontal className="h-3.5 w-3.5 opacity-30" /></button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-white/5">
                                            <DropdownMenuItem asChild className="text-xs font-bold p-2"><Link href={`/customers/detail?uuid=${c.uuid}`}><FileText className="mr-2 h-3.5 w-3.5" /> Dossier</Link></DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onEdit(c)} className="text-xs font-bold p-2"><Edit className="mr-2 h-3.5 w-3.5" /> Modifier</DropdownMenuItem>
                                            <DropdownMenuSeparator className="opacity-10" />
                                            <DropdownMenuItem onClick={() => onDelete(c)} className="text-destructive text-xs font-bold p-2"><Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer</DropdownMenuItem>
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
