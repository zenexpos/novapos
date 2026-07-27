'use client';

import { useState, useMemo, useDeferredValue, useEffect, useCallback } from 'react';
import { PageHeader }        from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button }            from '@/components/ui/button';
import { Input }             from '@/components/ui/input';
import { Skeleton }          from '@/components/ui/skeleton';
import { EmptyState }        from '@/components/ui/EmptyState';
import { AddPaymentDialog }  from '@/components/payments/AddPaymentDialog';
import { useLiveQuery }      from '@/hooks/useLiveQuery';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { db }                from '@/lib/db';
import type { Customer }     from '@/lib/types';
import Link from 'next/link';
import {
    formatCurrency, cn, safeNumber, formatCurrencyCompact,
} from '@/lib/utils';
import {
    BellRing, Search, Phone, MessageCircle,
    OctagonAlert, Clock, CircleCheckBig,
    HandCoins, Coins, ShieldAlert, FileText, Users2,
} from 'lucide-react';
import {
    differenceInDays, startOfDay, subMonths,
    setDate as fnsSetDate, format,
} from 'date-fns';
import { fr } from 'date-fns/locale';

type DebtTier = 'critical' | 'warning' | 'mild';

interface EnrichedDebtor {
    customer:    Customer;
    balance:     number;
    tier:        DebtTier;
    daysOverdue: number | null;
    nextDueDate: Date | null;
}

function computeDebtors(customers: Customer[]): EnrichedDebtor[] {
    const today = startOfDay(new Date());

    return customers
        .filter(c => safeNumber(c.outstandingBalance) > 0.01)
        .map(c => {
            const balance = safeNumber(c.outstandingBalance);
            let nextDueDate: Date | null = null;
            let daysOverdue: number | null = null;

            if (c.settlementDay) {
                let target = fnsSetDate(new Date(today), c.settlementDay);
                if (target > today) {
                    // not yet due
                } else {
                    const prev = fnsSetDate(subMonths(new Date(today), 0), c.settlementDay);
                    if (prev <= today) {
                        daysOverdue = differenceInDays(today, startOfDay(prev));
                    }
                    target = fnsSetDate(new Date(today), c.settlementDay);
                    if (target <= today) target = fnsSetDate(subMonths(new Date(today), -1), c.settlementDay);
                }
                nextDueDate = target;
            }

            let tier: DebtTier = 'mild';
            if (c.debtStatus === 'overdue' || (daysOverdue !== null && daysOverdue > 7)) tier = 'critical';
            else if (c.debtStatus === 'due_soon' || (daysOverdue !== null && daysOverdue > 0)) tier = 'warning';

            return { customer: c, balance, tier, daysOverdue, nextDueDate };
        })
        .sort((a, b) => {
            const tierOrder = { critical: 0, warning: 1, mild: 2 };
            if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
            return b.balance - a.balance;
        });
}

const tierConfig = {
    critical: {
        bg:     'bg-red-500/5 border-red-500/10',
        accent: 'border-l-2 border-l-red-500',
        badge:  'text-red-500 bg-red-500/10',
        label:  'En retard',
    },
    warning: {
        bg:     'bg-amber-500/5 border-amber-500/10',
        accent: 'border-l-2 border-l-amber-500',
        badge:  'text-amber-600 bg-amber-500/10',
        label:  'Dû bientôt',
    },
    mild: {
        bg:     'bg-card/40 border-border/40',
        accent: 'border-l-2 border-l-muted-foreground/20',
        badge:  'text-muted-foreground bg-muted/40',
        label:  'Actif',
    },
} as const;

function DebtorRow({ debtor, onPay }: { debtor: EnrichedDebtor; onPay: (c: Customer) => void }) {
    const { customer, balance, tier, daysOverdue, nextDueDate } = debtor;
    const cfg       = tierConfig[tier];
    const initials  = `${customer.firstName?.[0] ?? ''}${customer.lastName?.[0] ?? ''}`.toUpperCase() || '?';
    const limit     = safeNumber(customer.creditLimit);
    const usage     = limit > 0 ? Math.min(100, (balance / limit) * 100) : 0;
    const isOverLimit = limit > 0 && balance > limit;

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!customer.phone) return;
        const msg = encodeURIComponent(
            `Bonjour ${customer.firstName}, nous vous rappelons que votre solde de ${formatCurrency(balance)} est dû. Merci de régulariser. iPOS`,
        );
        window.open(`https://wa.me/${customer.phone.replace(/\s/g, '')}?text=${msg}`, '_blank');
    };

    return (
        <div className={cn(
            'group flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-150',
            cfg.bg, cfg.accent,
        )}>
            <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border',
                tier === 'critical' ? 'border-red-500/20 text-red-500'
                : tier === 'warning' ? 'border-amber-500/20 text-amber-500'
                : 'border-border/40 text-muted-foreground',
            )}>
                {initials}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-black truncate uppercase tracking-tight">
                        {customer.firstName} {customer.lastName}
                    </p>
                    {isOverLimit && <ShieldAlert className="h-3 w-3 text-red-500 shrink-0" />}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter', cfg.badge)}>
                        {cfg.label} {daysOverdue !== null && daysOverdue > 0 && `(${daysOverdue}j)`}
                    </span>

                    {nextDueDate && (
                        <span className="text-[8px] font-bold text-muted-foreground/30 uppercase">
                            Éch. {format(nextDueDate, 'dd MMM', { locale: fr })}
                        </span>
                    )}

                    {customer.phone && (
                        <span className="flex items-center gap-1 text-[8px] text-muted-foreground/20 font-mono">
                            <Phone className="h-2 w-2" /> {customer.phone}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                    <p className={cn(
                        'text-sm font-black tabular-nums tracking-tighter',
                        tier === 'critical' ? 'text-red-500' : tier === 'warning' ? 'text-amber-500' : 'text-foreground',
                    )}>
                        {formatCurrencyCompact(balance)}
                    </p>
                    {limit > 0 && (
                        <div className="w-12 h-1 bg-black/5 rounded-full mt-1 overflow-hidden">
                            <div className={cn('h-full', isOverLimit ? 'bg-red-500' : usage > 80 ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${usage}%` }} />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    {customer.phone && (
                        <Button variant="ghost" size="icon" onClick={handleWhatsApp} className="h-7 w-7 rounded-md text-emerald-500 hover:bg-emerald-500/10">
                            <MessageCircle className="h-3.5 w-3.5" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild className="h-7 w-7 rounded-md hover:bg-primary/10">
                        <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                            <FileText className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); onPay(customer); }} className="h-7 px-3 rounded-lg text-[9px] font-black uppercase">
                        Encaisser
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function DebtAlertsPage() {
    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState<'all' | DebtTier>('all');
    const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const deferredSearch = useDeferredValue(search);

    useEffect(() => { setIsMounted(true); }, []);

    const { value: customers, isLoading } = useLiveQuery(
        () => db.customers.where('outstandingBalance').above(0.01).filter(c => !c.deletedAt).toArray(),
        [],
    );

    const debtors = useMemo(() => computeDebtors(customers ?? []), [customers]);

    const filtered = useMemo(() => {
        let list = debtors;
        if (tierFilter !== 'all') list = list.filter(d => d.tier === tierFilter);
        if (deferredSearch) {
            const q = deferredSearch.toLowerCase();
            list = list.filter(d =>
                `${d.customer.firstName} ${d.customer.lastName}`.toLowerCase().includes(q) ||
                (d.customer.phone ?? '').includes(q),
            );
        }
        return list;
    }, [debtors, tierFilter, deferredSearch]);

    const kpis = useMemo(() => ({
        total:    debtors.reduce((s, d) => s + d.balance, 0),
        critical: debtors.filter(d => d.tier === 'critical').length,
        warning:  debtors.filter(d => d.tier === 'warning').length,
    }), [debtors]);

    useKeyboardShortcuts([
        { key: 'f', action: () => document.getElementById('debt-search')?.focus(), description: 'Rechercher', ignoreInputFocus: false },
    ], 'Alertes');

    if (!isMounted) return null;

    return (
        <div className="p-3 pb-24 max-w-[1400px] mx-auto space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Radar d'Alertes</h1>
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">Surveillance des créances clients</p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-white/5">
                    {[
                        { label: 'Total', value: formatCurrencyCompact(kpis.total), cls: 'text-primary' },
                        { label: 'Critique', value: kpis.critical, cls: 'text-red-500' },
                        { label: 'A venir', value: kpis.warning, cls: 'text-amber-500' },
                    ].map(k => (
                        <div key={k.label} className="px-3 py-1 bg-card/60 rounded-lg text-center min-w-[70px]">
                            <p className={cn('text-xs font-black tabular-nums', k.cls)}>{k.value}</p>
                            <p className="text-[7px] font-bold uppercase opacity-30 tracking-tighter">{k.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2 bg-card/30 p-1 rounded-xl border border-white/5">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
                    <Input
                        id="debt-search"
                        placeholder="Rechercher... [F]"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8 h-8 rounded-lg bg-black/10 border-none text-xs font-bold"
                    />
                </div>

                <div className="flex gap-1">
                    {(['all', 'critical', 'warning', 'mild'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTierFilter(t)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all',
                                tierFilter === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground/40 hover:text-foreground'
                            )}
                        >
                            {t === 'all' ? 'Tous' : t === 'critical' ? 'Retard' : t === 'warning' ? 'Bientôt' : 'Sain'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="space-y-1">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg bg-card/20" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState icon={CircleCheckBig} title="Zone Calme" description="Aucune anomalie financière détectée." />
                ) : (
                    <div className="space-y-1">
                        {filtered.map(debtor => (
                            <DebtorRow key={debtor.customer.uuid} debtor={debtor} onPay={setPaymentCustomer} />
                        ))}
                    </div>
                )}
            </div>

            {paymentCustomer && (
                <AddPaymentDialog
                    isOpen={!!paymentCustomer}
                    onOpenChange={o => { if (!o) setPaymentCustomer(null); }}
                    customer={paymentCustomer}
                    onPaymentSuccess={() => setPaymentCustomer(null)}
                />
            )}
        </div>
    );
}

