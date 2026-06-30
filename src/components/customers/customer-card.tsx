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
    clean:    { label: 'Solvable',  bg: 'bg-emerald-50/15', text: 'text-emerald-700', border: 'border-emerald-500/20', dot: 'bg-emerald-500', Icon: CheckCircle2  },
    due_soon: { label: 'Dû bientôt', bg: 'bg-amber-50/15',  text: 'text-amber-700',   border: 'border-amber-500/20',   dot: 'bg-amber-500',   Icon: Clock        },
    overdue:  { label: 'En retard',  bg: 'bg-red-50/15',    text: 'text-red-700',     border: 'border-red-500/20',     dot: 'bg-red-500 animate-pulse', Icon: AlertOctagon },
};

/**
 * UI AUDIT FIX:
 * - Legible font sizes (min 11px).
 * - Standardized spacing and hierarchy.
 * - Improved ARIA accessibility.
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
                'group relative flex flex-col rounded-3xl overflow-hidden cursor-pointer',
                'transition-all duration-300 ease-out',
                'border-2 bg-[var(--glass-bg)] backdrop-blur-sm',
                isSelected
                    ? 'border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15),0_12px_40px_rgba(0,0,0,0.25)] scale-[1.02]'
                    : 'border-[var(--glass-border)] hover:border-primary/40 hover:shadow-lg',
            )}
        >
            <div className={cn(
                'absolute inset-x-0 top-0 h-1 transition-all duration-300',
                debtState === 'clean'    && 'bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent',
                debtState === 'due_soon' && 'bg-gradient-to-r from-transparent via-amber-500/60 to-transparent',
                debtState === 'overdue'  && 'bg-gradient-to-r from-transparent via-red-500/70 to-transparent',
            )} />

            <div className="flex items-start gap-5 p-6 pb-4">
                <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-inner',
                    'transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
                    balance > 0
                        ? 'bg-primary/15 text-primary border-2 border-primary/25'
                        : 'bg-muted/80 text-muted-foreground border-2 border-muted-foreground/10',
                )}>
                    {initials}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-black text-lg tracking-tight leading-none truncate group-hover:text-primary transition-colors">
                            {customer.firstName} {customer.lastName}
                        </h3>
                        {customer.isBreadClient && (
                            <Wheat className="h-4 w-4 text-primary/60 shrink-0" />
                        )}
                    </div>
                    {customer.phone ? (
                        <p className="flex items-center gap-2 text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                        </p>
                    ) : (
                        <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                            Contact inconnu
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-xl border-2 transition-all',
                        isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-muted/20 border-border opacity-0 group-hover:opacity-100',
                    )}>
                        <Checkbox checked={isSelected} onCheckedChange={onToggleSelection}
                            className="h-5 w-5 border-0" aria-label="Sélectionner le client" />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Menu d'options"
                                className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-primary/15">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 border-none shadow-2xl">
                            <DropdownMenuItem asChild className="rounded-xl p-3">
                                <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                                    <FileText className="mr-3 h-4 w-4" /> Dossier Client
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(customer)} className="rounded-xl p-3">
                                <Edit className="mr-3 h-4 w-4" /> Modifier Fiche
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="opacity-10" />
                            <DropdownMenuItem onClick={() => onDelete(customer)}
                                className="text-destructive focus:text-destructive rounded-xl p-3">
                                <Trash2 className="mr-3 h-4 w-4" /> Révoquer Compte
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="px-6 pb-5">
                <span className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] border-2 shadow-sm',
                    debt.bg, debt.text, debt.border,
                )}>
                    <span className={cn('w-2.5 h-2.5 rounded-full', debt.dot)} />
                    {debt.label}
                    {isOverLimit && <AlertOctagon className="h-4 w-4 ml-1" />}
                </span>
            </div>

            {limit > 0 && (
                <div className="px-6 pb-6">
                    <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className={cn('h-4 w-4', isOverLimit ? 'text-red-600' : 'text-primary/60')} />
                            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/50">Engagement Crédit</span>
                        </div>
                        <span className={cn('text-[12px] font-black tabular-nums', isOverLimit ? 'text-red-600' : 'text-foreground')}>
                            {formatPercent(creditUsage, 0)}
                        </span>
                    </div>
                    <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-1000 ease-out',
                                isOverLimit       ? 'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.4)]' :
                                creditUsage > 80  ? 'bg-amber-50' :
                                                    'bg-primary',
                            )}
                            style={{ width: `${Math.min(100, creditUsage)}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 px-6 pb-6 mt-auto">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 group-hover:border-primary/20 transition-all">
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground/50 mb-2">
                        Total Flux
                    </p>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary/40" />
                        <p className="text-base font-black text-foreground tabular-nums tracking-tight">
                            {formatCurrency(spent)}
                        </p>
                    </div>
                </div>
                <div className={cn(
                    'p-4 rounded-2xl border-2 transition-all',
                    balance > 0.01
                        ? 'bg-red-500/[0.03] border-red-500/10 group-hover:border-red-500/30'
                        : 'bg-muted/30 border-border/40 group-hover:border-emerald-500/20',
                )}>
                    <p className={cn(
                        'text-[11px] font-black uppercase tracking-[0.1em] mb-2',
                        balance > 0.01 ? 'text-red-600/60' : 'text-muted-foreground/50',
                    )}>
                        Solde Dû
                    </p>
                    <p className={cn(
                        'text-base font-black tabular-nums tracking-tight',
                        balance > 0.01 ? 'text-red-600' : 'text-foreground',
                    )}>
                        {formatCurrency(balance)}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 px-6 py-4 bg-muted/5 group-hover:bg-muted/10 transition-all">
                <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                    {lastActivity ?? 'Nouveau membre'}
                </p>
                <div className="flex items-center gap-3">
                     {customer.phone && (
                        <Button variant="ghost" size="icon" onClick={handleWhatsApp} aria-label="WhatsApp"
                            className="h-10 w-10 rounded-xl text-emerald-600 hover:bg-emerald-500/10 active:scale-90 transition-all">
                            <MessageCircle className="h-5 w-5" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild onClick={e => e.stopPropagation()}
                        className="h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary active:scale-95 transition-all gap-2">
                        <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                            Détails <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const CustomerCard = React.memo(CustomerCardComponent);