'use client';

import React, { useState, useEffect, memo, useMemo } from 'react';
import { useActiveCart }                             from '@/stores/cartStore';
import { useAppStore }                               from '@/stores/appStore';
import {
    calculateCartTotals, calculateTVA, ttcToHt,
    formatCurrency, safeNumber, roundFinancial
} from '@/lib/utils';
import { AlertCircle, Tag, Receipt } from 'lucide-react';
import { cn }                       from '@/lib/utils';

function CartTotalBarContent() {
    const [isMounted, setIsMounted] = useState(false);
    const cart          = useActiveCart();
    const companyProfile = useAppStore(s => s.companyProfile);

    useEffect(() => { setIsMounted(true); }, []);

    const stats = useMemo(() => {
        if (!cart) return null;

        const activeItems  = cart.items.filter(i => i.cartQuantity > 0);
        const zeroItems    = cart.items.filter(i => i.cartQuantity === 0);
        const totals       = calculateCartTotals({ ...cart, items: activeItems });

        const tvaRate = safeNumber(companyProfile?.tvaRate ?? 0);
        const isTvaExempt = companyProfile?.isTvaExempt ?? true;
        let tvaAmount = 0;
        let htAmount  = totals.total;

        if (!isTvaExempt && tvaRate > 0) {
            htAmount  = roundFinancial(ttcToHt(totals.total, tvaRate));
            tvaAmount = roundFinancial(totals.total - htAmount);
        }

        const itemCount = activeItems.reduce((s, i) => s + i.cartQuantity, 0);

        return {
            ...totals,
            htAmount,
            tvaAmount,
            tvaRate,
            isTvaExempt,
            zeroCount: zeroItems.length,
            itemCount,
        };
    }, [cart, companyProfile?.tvaRate, companyProfile?.isTvaExempt]);

    if (!isMounted || !cart || !stats) return null;

    const hasDiscount = stats.discountAmount > 0.001;
    const hasTva      = !stats.isTvaExempt && stats.tvaRate > 0 && stats.tvaAmount > 0.001;

    return (
        <div className="space-y-2">
            {stats.zeroCount > 0 && (
                <div className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                    'bg-amber-500/10 border border-amber-500/20 text-amber-600',
                    'animate-slide-up',
                )}>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                        {stats.zeroCount} article{stats.zeroCount > 1 ? 's' : ''} à zéro — non facturé{stats.zeroCount > 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {(hasDiscount || hasTva) && (
                <div className="px-1 space-y-1 animate-fade-in">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/50">
                        <div className="flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            <span className="font-semibold uppercase tracking-wide">
                                Sous-total ({Math.round(stats.itemCount * 10) / 10} articles)
                            </span>
                        </div>
                        <span className="font-bold tabular-nums">{formatCurrency(stats.subtotal)}</span>
                    </div>

                    {hasDiscount && (
                        <div className="flex items-center justify-between text-[10px] text-emerald-500">
                            <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                <span className="font-black uppercase tracking-wide">
                                    Remise{cart.discount.type === 'percentage' ? ` (${cart.discount.value}%)` : ''}
                                </span>
                            </div>
                            <span className="font-black tabular-nums">-{formatCurrency(stats.discountAmount)}</span>
                        </div>
                    )}

                    {hasTva && (
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground/40">
                            <span className="font-semibold uppercase tracking-wide">
                                HT / TVA ({stats.tvaRate}%)
                            </span>
                            <span className="font-bold tabular-nums">
                                {formatCurrency(stats.htAmount)} + {formatCurrency(stats.tvaAmount)}
                            </span>
                        </div>
                    )}

                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
            )}

            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
                        {hasTva ? 'Total TTC' : 'Total Net'}
                    </span>
                    {stats.itemCount > 0 && (
                        <span className="text-[9px] font-semibold text-muted-foreground/30 uppercase">
                            {Math.round(stats.itemCount * 10) / 10} article{stats.itemCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className={cn(
                        'tabular-nums font-black tracking-tighter transition-all duration-300',
                        stats.total > 0 ? 'text-3xl text-primary' : 'text-2xl text-muted-foreground/30',
                    )}>
                        {formatCurrency(stats.total)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export const CartTotalBar = memo(CartTotalBarContent);
CartTotalBar.displayName = 'CartTotalBar';