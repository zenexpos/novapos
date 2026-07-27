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

const debtConfig = {
    clean:    { label: 'Solvable',  bg: 'bg-emerald-50/15', text: 'text-emerald-700', border: 'border-emerald-500/20', dot: 'bg-emerald-500', Icon: CheckCircle2  },
    due_soon: { label: 'Dû bientôt', bg: 'bg-amber-50/15',  text: 'text-amber-700',   border: 'border-amber-500/20',   dot: 'bg-amber-500',   Icon: Clock        },
    overdue:  { label: 'En retard',  bg: 'bg-red-50/15',    text: 'text-red-700',     border: 'border-red-500/20',     dot: 'bg-red-500 animate-pulse', Icon: AlertOctagon },
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
    
    const debtState = customer.debtStatus === 'overdue' ? 'overdue' : customer.debtStatus === 'due_soon' ? 'due_soon' : 'clean';
    const debt = debtConfig[debtState];

    const creditUsage = limit > 0 ? Math.min(100, (balance / limit) * 100) : 0;
    const isOverLimit = limit > 0 && balance > limit;

    const initials = useMemo(() => {
        return (customer.firstName?.[0] || '' + customer.lastName?.[0] || '').toUpperCase() || '?';
    }, [customer.firstName, customer.lastName]);

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!customer.phone) return;
        window.open(`https://wa.me/${customer.phone.replace(/\s/g, '')}`, '_blank');
    };

    return (
        <div
            onClick={() => isSelectionActive ? onToggleSelection() : onEdit(customer)}
            className={cn(
                'group relative flex flex-col rounded-xl overflow-hidden cursor-pointer border transition-all duration-150',
                isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/10' : 'hover:border-primary/40 bg-card/30',
            )}
        >
            <div className="flex items-start justify-between p-4 pb-2">
                <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border transition-transform group-hover:scale-105',
                    balance > 0 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-transparent'
                )}>
                    {initials}
                </div>

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onCheckedChange={onToggleSelection}
                        className="h-3.5 w-3.5 border-primary data-[state=checked]:bg-primary" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4 opacity-30" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild className="text-xs font-bold"><Link href={`/customers/detail?uuid=${customer.uuid}`}><FileText className="mr-2 h-3.5 w-3.5" /> Dossier</Link></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(customer)} className="text-xs font-bold"><Edit className="mr-2 h-3.5 w-3.5" /> Modifier</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive text-xs font-bold"><Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="px-4 pb-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-bold text-[13px] truncate leading-tight uppercase">{customer.firstName} {customer.lastName}</h3>
                    {customer.isBreadClient && <Wheat className="h-3 w-3 text-primary/40" />}
                </div>
                {customer.phone && <p className="text-[10px] font-medium text-muted-foreground/60">{customer.phone}</p>}
            </div>

            <div className="px-4 pb-4 space-y-3">
                <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border', debt.text, debt.bg, debt.border)}>
                    <debt.Icon className="h-2.5 w-2.5" /> {debt.label}
                </div>

                {limit > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase text-muted-foreground/50">
                            <span>Crédit : {formatCurrency(balance)} / {formatCurrency(limit)}</span>
                            <span className={cn(isOverLimit && "text-red-500")}>{formatPercent(creditUsage, 0)}</span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div className={cn('h-full transition-all duration-700', isOverLimit ? 'bg-red-500' : 'bg-primary')} style={{ width: `${Math.min(100, creditUsage)}%` }} />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-auto border-t border-border/40 grid grid-cols-2 bg-muted/5">
                <div className="p-3 border-r border-border/40 flex flex-col">
                    <span className="text-[8px] font-black uppercase text-muted-foreground/40 mb-0.5">Total Flux</span>
                    <span className="font-mono text-[11px] font-black tabular-nums">{formatCurrency(spent)}</span>
                </div>
                <div className="p-3 flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase text-muted-foreground/40 mb-0.5">Solde Dû</span>
                    <span className={cn("font-mono text-[11px] font-black tabular-nums", balance > 0 ? "text-red-500" : "text-emerald-600")}>{formatCurrency(balance)}</span>
                </div>
            </div>
        </div>
    );
};

export const CustomerCard = React.memo(CustomerCardComponent);
