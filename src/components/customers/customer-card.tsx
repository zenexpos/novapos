'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal, Edit, Trash2, FileText, Phone,
    BellRing, ShieldCheck, User, ChevronRight,
    Wheat, MessageCircle, TrendingUp, AlertOctagon,
    Clock, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatPercent, cn, safeNumber } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from '../ui/checkbox';

interface CustomerCardProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
    isSelectionActive: boolean;
}

type DebtState = 'clean' | 'due_soon' | 'overdue';

function getDebtState(customer: Customer): DebtState {
    if (customer.debtStatus === 'overdue')  return 'overdue';
    if (customer.debtStatus === 'due_soon') return 'due_soon';
    return 'clean';
}

const debtConfig = {
    clean:    { label: 'Solvable',  bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', dot: 'bg-emerald-500', Icon: CheckCircle2  },
    due_soon: { label: 'Dû bientôt', bg: 'bg-amber-500/10',  text: 'text-amber-500',   border: 'border-amber-500/20',   dot: 'bg-amber-500',   Icon: Clock        },
    overdue:  { label: 'En retard',  bg: 'bg-red-500/10',    text: 'text-red-500',     border: 'border-red-500/20',     dot: 'bg-red-500 animate-pulse', Icon: AlertOctagon },
};

const CustomerCardComponent = ({
    customer, onEdit, onDelete,
    isSelected, onToggleSelection, isSelectionActive,
}: CustomerCardProps) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const balance  = safeNumber(customer.outstandingBalance);
    const limit    = safeNumber(customer.creditLimit);
    const spent    = safeNumber(customer.totalSpent);
    const debtState = getDebtState(customer);
    const debt = debtConfig[debtState];

    const creditUsage = limit > 0 ? Math.min(100, (balance / limit) * 100) : 0;
    const isOverLimit = limit > 0 && balance > limit;

    const initials = useMemo(() => {
        const f = customer.firstName?.[0] ?? '';
        const l = customer.lastName?.[0] ?? '';
        return (f + l).toUpperCase() || '?';
    }, [customer.firstName, customer.lastName]);

    const lastActivity = useMemo(() => {
        if (!isMounted || !customer.lastActivityDate) return null;
        return formatDistanceToNow(new Date(customer.lastActivityDate), { addSuffix: true, locale: fr });
    }, [isMounted, customer.lastActivityDate]);

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!customer.phone) return;
        const msg = encodeURIComponent(`Bonjour ${customer.firstName}, votre solde est de ${formatCurrency(balance)}. Merci.`);
        window.open(`https://wa.me/${customer.phone.replace(/\s/g, '')}?text=${msg}`, '_blank');
    };

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button, a, input, [role="menuitem"]')) return;
        if (isSelectionActive) { onToggleSelection(); } else { onEdit(customer); }
    };

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                'group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer',
                'transition-all duration-300 ease-out',
                'border bg-[var(--glass-bg)] backdrop-blur-sm',
                isSelected
                    ? 'border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.5),0_8px_32px_rgba(0,0,0,0.25)] scale-[1.01]'
                    : 'border-[var(--glass-border)] hover:border-primary/30 hover:shadow-sm',
            )}
        >
            {/* ── Debt accent bar ── */}
            <div className={cn(
                'absolute inset-x-0 top-0 h-0.5 transition-all duration-300',
                debtState === 'clean'    && 'bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent',
                debtState === 'due_soon' && 'bg-gradient-to-r from-transparent via-amber-500/60 to-transparent',
                debtState === 'overdue'  && 'bg-gradient-to-r from-transparent via-red-500/70 to-transparent',
            )} />

            {/* ── Header ── */}
            <div className="flex items-start gap-3 p-4 pb-3">
                {/* Avatar */}
                <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shrink-0',
                    'transition-all duration-300 group-hover:scale-105',
                    balance > 0
                        ? 'bg-primary/15 text-primary border border-primary/25'
                        : 'bg-muted/60 text-muted-foreground border border-muted',
                )}>
                    {initials}
                </div>

                {/* Name & phone */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-black text-base tracking-tight leading-tight truncate group-hover:text-primary transition-colors">
                            {customer.firstName} {customer.lastName}
                        </h3>
                        {customer.isBreadClient && (
                            <Wheat className="h-3 w-3 text-primary/50 shrink-0" />
                        )}
                    </div>
                    {customer.phone ? (
                        <p className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide">
                            <Phone className="h-2.5 w-2.5" />
                            {customer.phone}
                        </p>
                    ) : (
                        <p className="text-[10px] font-semibold text-muted-foreground/25 uppercase tracking-wide italic">
                            Sans contact
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <div className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-md border transition-all',
                        isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-[var(--glass-bg)] border-[var(--glass-border)] opacity-0 group-hover:opacity-100',
                    )}>
                        <Checkbox checked={isSelected} onCheckedChange={onToggleSelection}
                            className="h-3 w-3 border-0" />
                    </div>
                    {customer.phone && (
                        <Button variant="ghost" size="icon" onClick={handleWhatsApp}
                            className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 text-green-500 hover:bg-green-500/10">
                            <MessageCircle className="h-3.5 w-3.5" />
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"
                                className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary/10">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                                <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                                    <FileText className="mr-2 h-3.5 w-3.5" /> Voir le dossier
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                                <Edit className="mr-2 h-3.5 w-3.5" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(customer)}
                                className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* ── Debt status badge ── */}
            <div className="px-4 pb-3">
                <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border',
                    debt.bg, debt.text, debt.border,
                )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', debt.dot)} />
                    {debt.label}
                    {isOverLimit && <AlertOctagon className="h-3 w-3 ml-0.5" />}
                </span>
            </div>

            {/* ── Credit line progress ── */}
            {limit > 0 && (
                <div className="px-4 pb-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className={cn('h-3 w-3', isOverLimit ? 'text-red-500' : 'text-muted-foreground/40')} />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Crédit utilisé</span>
                        </div>
                        <span className={cn('text-[10px] font-black tabular-nums', isOverLimit ? 'text-red-500' : 'text-muted-foreground/60')}>
                            {formatPercent(creditUsage, 0)}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-700',
                                isOverLimit       ? 'bg-red-500'   :
                                creditUsage > 80  ? 'bg-amber-500' :
                                                    'bg-primary',
                            )}
                            style={{ width: `${Math.min(100, creditUsage)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <p className="text-[8px] font-semibold text-muted-foreground/30 uppercase">
                            {formatCurrency(balance)} / {formatCurrency(limit)}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 gap-2 px-4 pb-3">
                <div className="p-2.5 rounded-xl bg-muted/20 border border-muted/40">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1">
                        Total dépensé
                    </p>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-primary/50" />
                        <p className="text-sm font-black text-foreground tabular-nums tracking-tight">
                            {formatCurrency(spent)}
                        </p>
                    </div>
                </div>
                <div className={cn(
                    'p-2.5 rounded-xl border',
                    balance > 0
                        ? 'bg-red-500/5 border-red-500/15'
                        : 'bg-muted/20 border-muted/40',
                )}>
                    <p className={cn(
                        'text-[8px] font-bold uppercase tracking-widest mb-1',
                        balance > 0 ? 'text-red-500/60' : 'text-muted-foreground/40',
                    )}>
                        Solde dû
                    </p>
                    <p className={cn(
                        'text-sm font-black tabular-nums tracking-tight',
                        balance > 0 ? 'text-red-500' : 'text-foreground',
                    )}>
                        {formatCurrency(balance)}
                    </p>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between border-t border-[var(--glass-border)] px-4 py-2.5 bg-muted/5 mt-auto">
                <p className="text-[8px] font-semibold text-muted-foreground/30 uppercase tracking-wide">
                    {lastActivity ?? 'Aucune activité'}
                </p>
                <Button variant="ghost" size="sm" asChild onClick={e => e.stopPropagation()}
                    className="h-7 px-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-primary/10 hover:text-primary">
                    <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                        Dossier <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </div>
        </div>
    );
};

export const CustomerCard = React.memo(CustomerCardComponent);
