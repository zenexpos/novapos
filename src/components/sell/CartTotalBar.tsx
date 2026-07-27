'use client';

import React, { useState, useEffect, memo, useMemo } from 'react';
import { useActiveCart }                             from '@/stores/cartStore';
import { useAppStore }                               from '@/stores/appStore';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

function CartTotalBarContent() {
    const [isMounted, setIsMounted] = useState(false);
    const cart = useActiveCart();

    useEffect(() => { setIsMounted(true); }, []);

    const totals = useMemo(() => cart ? calculateCartTotals(cart) : null, [cart]);

    if (!isMounted || !cart || !totals) return null;

    return (
        <div className="px-2">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">Total Transaction</span>
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{cart.items.length} positions</span>
                </div>
                <div className="text-right">
                    <span className={cn(
                        "font-black tracking-tighter tabular-nums transition-all",
                        totals.total > 0 ? "text-3xl text-primary" : "text-2xl text-muted-foreground/20"
                    )}>
                        {formatCurrency(totals.total)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export const CartTotalBar = memo(CartTotalBarContent);
CartTotalBar.displayName = 'CartTotalBar';
