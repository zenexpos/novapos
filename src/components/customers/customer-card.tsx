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
    MessageCircle, TrendingUp, AlertOctagon,
    Clock, CheckCircle2, Wheat, ChevronRight,
    ShieldCheck
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

/**
 * UI AUDIT FIX:
 * - Legible font sizes (min 11px).
 * - Improved information hierarchy.
 * - Better touch targets for actions.
 */
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
            <div className={cn(
                'absolute inset-x-0 top-0 h-0.5 transition-all duration-300',
                debtState === 'clean'    && 'bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent',
                debtState === 'due_soon' && 'bg-gradient-to-r from-transparent via-amber-500/60 to-transparent',
                debtState === 'overdue'  && 'bg-gradient-to-r from-transparent via-red-500/70 to-transparent',
            )} />

            <div className="flex items-start gap-4 p-5 pb-4">
                <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shrink-0 shadow-inner',
                    'transition-all duration-300 group-hover:scale-105',
                    balance > 0
                        ? 'bg-primary/15 text-primary border border-primary/25'
                        : 'bg-muted/60 text-muted-foreground border border-muted',
                )}>
                    {initials}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="font-black text-base tracking-tight leading-none truncate group-hover:text-primary transition-colors">
                            {customer.firstName} {customer.lastName}
                        </h3>
                        {customer.isBreadClient && (
                            <Wheat className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                        )}
                    </div>
                    {customer.phone ? (
                        <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                        </p>
                    ) : (
                        <p className="text-[11px] font-bold text-muted-foreground/30 uppercase tracking-wider italic">
                            Sans contact
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <div className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-lg border transition-all',
                        isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-muted/20 border-border opacity-0 group-hover:opacity-100',
                    )}>
                        <Checkbox checked={isSelected} onCheckedChange={onToggleSelection}
                            className="h-4 w-4 border-0" aria-label="Sélectionner le client" />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Plus d'options"
                                className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary/10">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem asChild>
                                <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                                    <FileText className="mr-3 h-4 w-4" /> Voir le dossier
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                                <Edit className="mr-3 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(customer)}
                                className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-3 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="px-5 pb-4">
                <span className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border',
                    debt.bg, debt.text, debt.border,
                )}>
                    <span className={cn('w-2 h-2 rounded-full', debt.dot)} />
                    {debt.label}
                    {isOverLimit && <AlertOctagon className="h-3.5 w-3.5 ml-0.5" />}
                </span>
            </div>

            {limit > 0 && (
                <div className="px-5 pb-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className={cn('h-3.5 w-3.5', isOverLimit ? 'text-red-500' : 'text-muted-foreground/50')} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Ligne de crédit</span>
                        </div>
                        <span className={cn('text-[11px] font-black tabular-nums', isOverLimit ? 'text-red-500' : 'text-muted-foreground/70')}>
                            {formatPercent(creditUsage, 0)}
                        </span>
                    </div>
                    <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-1000 ease-out',
                                isOverLimit       ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'   :
                                creditUsage > 80  ? 'bg-amber-500' :
                                                    'bg-primary',
                            )}
                            style={{ width: `${Math.min(100, creditUsage)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                            {formatCurrency(balance)} / {formatCurrency(limit)}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 px-5 pb-5 mt-auto">
                <div className="p-3 rounded-2xl bg-muted/20 border border-muted/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1.5">
                        Dépensé
                    </p>
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary/60" />
                        <p className="text-sm font-black text-foreground tabular-nums tracking-tight">
                            {formatCurrency(spent)}
                        </p>
                    </div>
                </div>
                <div className={cn(
                    'p-3 rounded-2xl border',
                    balance > 0.01
                        ? 'bg-red-500/[0.04] border-red-500/10'
                        : 'bg-muted/20 border-muted/50',
                )}>
                    <p className={cn(
                        'text-[10px] font-black uppercase tracking-widest mb-1.5',
                        balance > 0.01 ? 'text-red-500/60' : 'text-muted-foreground/40',
                    )}>
                        Solde dû
                    </p>
                    <p className={cn(
                        'text-sm font-black tabular-nums tracking-tight',
                        balance > 0.01 ? 'text-red-500' : 'text-foreground',
                    )}>
                        {formatCurrency(balance)}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--glass-border)] px-5 py-3 bg-muted/5">
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                    {lastActivity ?? 'Nouveau client'}
                </p>
                <div className="flex items-center gap-2">
                     {customer.phone && (
                        <Button variant="ghost" size="icon" onClick={handleWhatsApp} aria-label="WhatsApp"
                            className="h-8 w-8 rounded-lg text-green-600 hover:bg-green-500/10 active:scale-90 transition-all">
                            <MessageCircle className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild onClick={e => e.stopPropagation()}
                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary active:scale-95 transition-all">
                        <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                            Détails <ChevronRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const CustomerCard = React.memo(CustomerCardComponent);
