'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Customer } from '@/lib/types';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal, Edit, Trash2, FileText, Phone,
    MessageCircle, Wheat, ChevronUp, ChevronDown,
    ChevronsUpDown, BellRing, Clock, CheckCircle2,
    AlertOctagon, ShieldCheck, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatCurrency, formatPercent, safeNumber } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CustomerTableProps {
    customers: Customer[];
    onEdit:   (c: Customer) => void;
    onDelete: (c: Customer) => void;
    selectedCustomers: Set<string>;
    onToggleSelection:    (uuid: string) => void;
    onToggleSelectAll: () => void;
}

type SortKey = 'name' | 'initialBalance' | 'totalSpent' | 'outstandingBalance' | 'creditUsage' | 'lastActivity';
type SortDir = 'asc' | 'desc';

const debtBadge = {
    overdue:  { Icon: BellRing,       cls: 'text-red-500 bg-red-500/10 border-red-500/20',     label: 'En retard'   },
    due_soon: { Icon: Clock,           cls: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Dû bientôt' },
    ok:       { Icon: CheckCircle2,    cls: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'Solvable' },
} as const;

function SortIcon({ col, sortKey, sortDir }:
    { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
    if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc'
        ? <ChevronUp   className="h-3 w-3 text-primary" />
        : <ChevronDown className="h-3 w-3 text-primary" />;
}

export function CustomerTable({
    customers, onEdit, onDelete,
    selectedCustomers, onToggleSelection, onToggleSelectAll,
}: CustomerTableProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [sortKey, setSortKey]     = useState<SortKey>('lastActivity');
    const [sortDir, setSortDir]     = useState<SortDir>('desc');
    useEffect(() => { setIsMounted(true); }, []);

    const toggleSort = (key: SortKey) => {
        if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const sorted = useMemo(() => {
        return [...customers].sort((a, b) => {
            let va = 0, vb = 0;
            if (sortKey === 'name') {
                const na = `${a.firstName} ${a.lastName}`;
                const nb = `${b.firstName} ${b.lastName}`;
                return sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
            }

            if (sortKey === 'initialBalance') {
                va = safeNumber(a.initialBalance);
                vb = safeNumber(b.initialBalance);
            }

            if (sortKey === 'totalSpent') {
                va = safeNumber(a.totalSpent);
                vb = safeNumber(b.totalSpent);
            }

            if (sortKey === 'outstandingBalance') {
                va = safeNumber(a.outstandingBalance);
                vb = safeNumber(b.outstandingBalance);
            }

            if (sortKey === 'creditUsage') {
                const limA = safeNumber(a.creditLimit);
                const limB = safeNumber(b.creditLimit);
                va = limA > 0 ? safeNumber(a.outstandingBalance) / limA : 0;
                vb = limB > 0 ? safeNumber(b.outstandingBalance) / limB : 0;
            }

            if (sortKey === 'lastActivity') {
                va = a.lastActivityDate ? new Date(a.lastActivityDate).getTime() : 0;
                vb = b.lastActivityDate ? new Date(b.lastActivityDate).getTime() : 0;
            }
            return sortDir === 'asc' ? va - vb : vb - va;
        });
    }, [customers, sortKey, sortDir]);

    const allSelected = customers.length > 0 && selectedCustomers.size === customers.length;

    const thCls = 'px-3 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap';
    const thBtn = 'flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors';

    return (
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-[var(--glass-border)] hover:bg-transparent">
                        <TableHead className="w-12 px-4">
                            <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll}
                                className="border-primary data-[state=checked]:bg-primary" />
                        </TableHead>

                        <TableHead className={thCls}>
                            <button className={thBtn} onClick={() => toggleSort('name')}>
                                Client <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className={thCls}>État</TableHead>

                        <TableHead className={cn(thCls, 'hidden md:table-cell')}>Contact</TableHead>

                        <TableHead className={cn(thCls, 'text-right hidden lg:table-cell')}>
                            <button className={cn(thBtn, 'ml-auto')} onClick={() => toggleSort('creditUsage')}>
                                Crédit <SortIcon col="creditUsage" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className={cn(thCls, 'text-right hidden md:table-cell')}>
                            <button className={cn(thBtn, 'ml-auto')} onClick={() => toggleSort('initialBalance')}>
                                Solde initial <SortIcon col="initialBalance" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className={cn(thCls, 'text-right hidden sm:table-cell')}>
                            <button className={cn(thBtn, 'ml-auto')} onClick={() => toggleSort('totalSpent')}>
                                Dépensé <SortIcon col="totalSpent" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className={cn(thCls, 'text-right')}>
                            <button className={cn(thBtn, 'ml-auto')} onClick={() => toggleSort('outstandingBalance')}>
                                Solde dû <SortIcon col="outstandingBalance" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className={cn(thCls, 'hidden lg:table-cell')}>
                            <button className={thBtn} onClick={() => toggleSort('lastActivity')}>
                                Activité <SortIcon col="lastActivity" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className="w-10 px-2" />
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {sorted.map(customer => {
                        const isSelected = selectedCustomers.has(customer.uuid);
                        const balance    = safeNumber(customer.outstandingBalance);
                        const limit      = safeNumber(customer.creditLimit);
                        const spent      = safeNumber(customer.totalSpent);
                        const usage      = limit > 0 ? Math.min(100, (balance / limit) * 100) : 0;
                        const isOverLimit = limit > 0 && balance > limit;

                        const debt = customer.debtStatus === 'overdue'  ? debtBadge.overdue
                                   : customer.debtStatus === 'due_soon' ? debtBadge.due_soon
                                   : debtBadge.ok;

                        const initials = `${customer.firstName?.[0] ?? ''}${customer.lastName?.[0] ?? ''}`.toUpperCase() || '?';

                        const lastActivity = isMounted && customer.lastActivityDate
                            ? formatDistanceToNow(new Date(customer.lastActivityDate), { addSuffix: true, locale: fr })
                            : null;

                        const handleWhatsApp = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            if (!customer.phone) return;
                            const msg = encodeURIComponent(`Bonjour ${customer.firstName}, votre solde est de ${formatCurrency(balance)}. Merci.`);
                            window.open(`https://wa.me/${customer.phone.replace(/\s/g, '')}?text=${msg}`, '_blank');
                        };

                        return (
                            <TableRow
                                key={customer.uuid}
                                onClick={() => onToggleSelection(customer.uuid)}
                                className={cn(
                                    'group border-b border-[var(--glass-border)] cursor-pointer transition-all duration-150',
                                    isSelected
                                        ? 'bg-primary/8 border-l-2 border-l-primary'
                                        : 'hover:bg-primary/4',
                                )}
                            >
                                {/* Checkbox */}
                                <TableCell className="px-4" onClick={e => e.stopPropagation()}>
                                    <Checkbox checked={isSelected}
                                        onCheckedChange={() => onToggleSelection(customer.uuid)}
                                        className="border-primary data-[state=checked]:bg-primary" />
                                </TableCell>

                                {/* Client */}
                                <TableCell className="px-3 py-3">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className={cn(
                                            'w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 transition-all',
                                            balance > 0
                                                ? 'bg-primary/15 text-primary border border-primary/25'
                                                : 'bg-muted/60 text-muted-foreground border border-muted',
                                        )}>
                                            {initials}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-black text-sm leading-tight group-hover:text-primary transition-colors">
                                                    {customer.firstName} {customer.lastName}
                                                </span>
                                                {customer.isBreadClient && (
                                                    <Wheat className="h-3 w-3 text-primary/40 shrink-0" />
                                                )}
                                            </div>
                                            {isOverLimit && (
                                                <span className="flex items-center gap-1 text-[9px] font-bold text-red-500">
                                                    <AlertOctagon className="h-2.5 w-2.5" /> Limite dépassée
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>

                                {/* État */}
                                <TableCell className="px-3 py-3">
                                    <span className={cn(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide border',
                                        debt.cls,
                                    )}>
                                        <debt.Icon className="h-2.5 w-2.5" />
                                        {debt.label}
                                    </span>
                                </TableCell>

                                {/* Contact */}
                                <TableCell className="px-3 py-3 hidden md:table-cell">
                                    {customer.phone ? (
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/60">
                                                <Phone className="h-3 w-3" />
                                                {customer.phone}
                                            </span>
                                            <Button variant="ghost" size="icon"
                                                onClick={handleWhatsApp}
                                                className="h-6 w-6 rounded-md text-green-500 hover:bg-green-500/10 opacity-0 group-hover:opacity-100 transition-all">
                                                <MessageCircle className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground/25 italic">—</span>
                                    )}
                                </TableCell>

                                {/* Crédit */}
                                <TableCell className="px-3 py-3 hidden lg:table-cell">
                                    {limit > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 max-w-[80px]">
                                                <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn('h-full rounded-full transition-all',
                                                            isOverLimit ? 'bg-red-500'   :
                                                            usage > 80  ? 'bg-amber-500' : 'bg-primary')}
                                                        style={{ width: `${Math.min(100, usage)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className={cn(
                                                'text-[10px] font-black tabular-nums',
                                                isOverLimit ? 'text-red-500' : 'text-muted-foreground/60',
                                            )}>
                                                {formatPercent(usage, 0)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/30">
                                            <ShieldCheck className="h-3 w-3" /> Illimité
                                        </div>
                                    )}
                                </TableCell>

                                {/* Solde initial */}
                                <TableCell className="px-3 py-3 text-right hidden md:table-cell">
                                    <span className="font-mono text-[11px] font-bold text-muted-foreground/60 tabular-nums">
                                        {formatCurrency(safeNumber(customer.initialBalance))}
                                    </span>
                                </TableCell>

                                {/* Total dépensé */}
                                <TableCell className="px-3 py-3 text-right hidden sm:table-cell">
                                    <div className="flex items-center justify-end gap-1">
                                        <TrendingUp className="h-3 w-3 text-primary/40" />
                                        <span className="font-mono text-[11px] font-bold text-muted-foreground/60 tabular-nums">
                                            {formatCurrency(spent)}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* Solde dû */}
                                <TableCell className="px-3 py-3 text-right">
                                    <span className={cn(
                                        'font-mono text-sm font-black tabular-nums',
                                        balance > 0 ? 'text-red-500' : 'text-muted-foreground/40',
                                    )}>
                                        {formatCurrency(balance)}
                                    </span>
                                </TableCell>

                                {/* Activité */}
                                <TableCell className="px-3 py-3 hidden lg:table-cell">
                                    <span className="text-[10px] font-semibold text-muted-foreground/40">
                                        {lastActivity ?? '—'}
                                    </span>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="px-2 py-3" onClick={e => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"
                                                className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-all">
                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                                                    <FileText className="mr-2 h-3.5 w-3.5" /> Dossier
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                                                <Edit    className="mr-2 h-3.5 w-3.5" /> Modifier
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onDelete(customer)}
                                                className="text-destructive focus:text-destructive">
                                                <Trash2  className="mr-2 h-3.5 w-3.5" /> Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}

                    {customers.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={10} className="h-40 text-center">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                                    <CheckCircle2 className="h-8 w-8" />
                                    <p className="text-sm font-semibold uppercase tracking-widest">Aucun client</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {customers.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--glass-border)] bg-muted/5">
                    <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
                        {customers.length} client{customers.length > 1 ? 's' : ''}
                        {selectedCustomers.size > 0 && (
                            <span className="ml-2 text-primary">
                                · {selectedCustomers.size} sélectionné{selectedCustomers.size > 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                    <p className="text-[9px] font-semibold text-muted-foreground/30 uppercase tracking-widest">
                        Tri: {sortKey} {sortDir === 'asc' ? '↑' : '↓'}
                    </p>
                </div>
            )}
        </div>
    );
}
