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
    AlertOctagon, Clock, CheckCircle2,
    HandCoins, Coins, ShieldAlert, FileText, Users2,
} from 'lucide-react';
import {
    differenceInDays, startOfDay, subMonths,
    setDate as fnsSetDate, format,
} from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── helpers ─────────────────────────────────────────────────────────────────

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
        bg:     'bg-red-500/8 border-red-500/20 hover:border-red-500/35',
        accent: 'border-l-4 border-l-red-500',
        badge:  'bg-red-500/12 text-red-500 border-red-500/20',
        icon:   AlertOctagon,
        label:  'En retard',
        dot:    'bg-red-500 animate-pulse',
    },
    warning: {
        bg:     'bg-amber-500/8 border-amber-500/20 hover:border-amber-500/35',
        accent: 'border-l-4 border-l-amber-500',
        badge:  'bg-amber-500/12 text-amber-500 border-amber-500/20',
        icon:   Clock,
        label:  'Dû bientôt',
        dot:    'bg-amber-500',
    },
    mild: {
        bg:     'bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-primary/20',
        accent: 'border-l-4 border-l-muted',
        badge:  'bg-muted/30 text-muted-foreground border-muted',
        icon:   CheckCircle2,
        label:  'Actif',
        dot:    'bg-muted-foreground/40',
    },
} as const;

// ─── DebtorRow ────────────────────────────────────────────────────────────────

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
            'group relative flex items-center gap-4 px-4 py-3.5 rounded-xl border',
            'transition-all duration-200 cursor-pointer',
            cfg.bg, cfg.accent,
        )}>
            {/* Avatar */}
            <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0',
                tier === 'critical' ? 'bg-red-500/15 text-red-500 border border-red-500/25'
                : tier === 'warning' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25'
                : 'bg-muted/50 text-muted-foreground border border-muted',
            )}>
                {initials}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-black truncate">
                        {customer.firstName} {customer.lastName}
                    </p>
                    {isOverLimit && (
                        <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Status badge */}
                    <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border',
                        cfg.badge,
                    )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                        {cfg.label}
                        {daysOverdue !== null && daysOverdue > 0 && (
                            <span> — {daysOverdue}j</span>
                        )}
                    </span>

                    {/* Next due date */}
                    {nextDueDate && (
                        <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wide">
                            Éch. {format(nextDueDate, 'dd MMM', { locale: fr })}
                        </span>
                    )}

                    {/* Phone */}
                    {customer.phone && (
                        <span className="flex items-center gap-1 text-[9px] text-muted-foreground/35">
                            <Phone className="h-2.5 w-2.5" />
                            {customer.phone}
                        </span>
                    )}
                </div>

                {/* Credit usage bar */}
                {limit > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all duration-700',
                                    isOverLimit ? 'bg-red-500' : usage > 80 ? 'bg-amber-500' : 'bg-primary',
                                )}
                                style={{ width: `${Math.min(100, usage)}%` }}
                            />
                        </div>
                        <span className="text-[8px] font-black text-muted-foreground/40 w-10 text-right tabular-nums">
                            {usage.toFixed(0)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Balance + actions */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                    <p className={cn(
                        'text-lg font-black tabular-nums tracking-tight',
                        tier === 'critical' ? 'text-red-500'
                        : tier === 'warning' ? 'text-amber-500'
                        : 'text-foreground',
                    )}>
                        {formatCurrencyCompact(balance)}
                    </p>
                    <p className="text-[8px] font-semibold text-muted-foreground/30 uppercase">Solde dû</p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onPay(customer); }}
                        className="h-7 px-3 rounded-lg text-[9px] font-black uppercase tracking-wide"
                    >
                        <HandCoins className="h-3 w-3 mr-1" />
                        Encaisser
                    </Button>
                    <div className="flex gap-1">
                        {customer.phone && (
                            <Button
                                variant="ghost" size="icon"
                                onClick={handleWhatsApp}
                                className="h-7 w-7 rounded-md text-green-500 hover:bg-green-500/10"
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        <Button
                            variant="ghost" size="icon" asChild
                            className="h-7 w-7 rounded-md hover:bg-primary/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <Link href={`/customers/detail?uuid=${customer.uuid}`}>
                                <FileText className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DebtAlertsPage() {
    const [search, setSearch]             = useState('');
    const [tierFilter, setTierFilter]     = useState<'all' | DebtTier>('all');
    const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
    const [isMounted, setIsMounted]       = useState(false);
    const deferredSearch                  = useDeferredValue(search);

    useEffect(() => { setIsMounted(true); }, []);

    const { value: customers, isLoading } = useLiveQuery(
        () => db.customers.filter(c => safeNumber(c.outstandingBalance) > 0.01).toArray(),
        [],
    );

    const handlePaymentSuccess = useCallback(() => {
        setPaymentCustomer(null);
    }, []);

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

    // KPIs
    const kpis = useMemo(() => ({
        total:    debtors.reduce((s, d) => s + d.balance, 0),
        critical: debtors.filter(d => d.tier === 'critical').length,
        warning:  debtors.filter(d => d.tier === 'warning').length,
        count:    debtors.length,
    }), [debtors]);

    useKeyboardShortcuts([
        { key: 'f', action: () => document.getElementById('debt-search')?.focus(), description: 'Rechercher', ignoreInputFocus: false },
    ], 'Alertes');

    const tierBtns: { key: 'all' | DebtTier; label: string; count: number }[] = [
        { key: 'all',      label: 'Tous',       count: debtors.length },
        { key: 'critical', label: 'En retard',  count: kpis.critical },
        { key: 'warning',  label: 'Dû bientôt', count: kpis.warning },
        { key: 'mild',     label: 'Actifs',     count: debtors.filter(d => d.tier === 'mild').length },
    ];

    return (
        <div className="p-4 sm:p-5 pb-24 max-w-5xl mx-auto space-y-5 animate-page-enter">
            <PageHeader
                title="Alertes de Dettes"
                description="Suivi des créances clients en temps réel"
                icon={BellRing}
            >
                {/* KPI bar */}
                <div className="flex items-center gap-3">
                    {[
                        { label: 'Total dû', value: formatCurrencyCompact(kpis.total), color: 'text-primary' },
                        { label: 'Critiques', value: kpis.critical, color: 'text-red-500' },
                        { label: 'À venir', value: kpis.warning, color: 'text-amber-500' },
                    ].map(k => (
                        <div key={k.label} className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                            <span className={cn('text-base font-black tabular-nums', k.color)}>{k.value}</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">{k.label}</span>
                        </div>
                    ))}
                </div>
            </PageHeader>

            {/* Search + filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
                    <Input
                        id="debt-search"
                        placeholder="Rechercher un client..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 h-10 rounded-xl bg-[var(--glass-bg)] border-[var(--glass-border)]"
                    />
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                    {tierBtns.map(btn => (
                        <button
                            key={btn.key}
                            onClick={() => setTierFilter(btn.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all',
                                tierFilter === btn.key
                                    ? 'bg-primary/15 text-primary border border-primary/25'
                                    : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/40',
                            )}
                        >
                            {btn.label}
                            {btn.count > 0 && (
                                <span className={cn(
                                    'inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[8px] font-black',
                                    tierFilter === btn.key
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/60 text-muted-foreground',
                                )}>
                                    {btn.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: Coins,     label: 'Total encours',   value: formatCurrency(kpis.total),  color: 'text-primary'    },
                    { icon: AlertOctagon, label: 'Critiques',    value: `${kpis.critical} clients`,   color: 'text-red-500'    },
                    { icon: Users2,    label: 'Débiteurs actifs', value: `${kpis.count} clients`,    color: 'text-foreground' },
                ].map(stat => (
                    <Card key={stat.label} className="overflow-hidden">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={cn('p-2.5 rounded-xl bg-muted/30', stat.color)}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{stat.label}</p>
                                <p className={cn('text-base font-black tabular-nums leading-tight', stat.color)}>{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={search ? Search : CheckCircle2}
                    title={search ? 'Aucun résultat' : 'Aucune dette en cours'}
                    description={search
                        ? `Aucun client trouvé pour "${search}".`
                        : 'Tous vos clients sont à jour. Excellent !'}
                />
            ) : (
                <div className="space-y-2 stagger-children">
                    {filtered.map(debtor => (
                        <DebtorRow
                            key={debtor.customer.uuid}
                            debtor={debtor}
                            onPay={setPaymentCustomer}
                        />
                    ))}
                </div>
            )}

            {/* Footer count */}
            {filtered.length > 0 && (
                <p className="text-center text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-widest">
                    {filtered.length} client{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
                </p>
            )}

            {/* Payment dialog */}
            {paymentCustomer && (
                <AddPaymentDialog
                    isOpen={!!paymentCustomer}
                    onOpenChange={open => { if (!open) setPaymentCustomer(null); }}
                    customer={paymentCustomer}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}