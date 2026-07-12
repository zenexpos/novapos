'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/lib/types';
import { calculateCartTotals, formatCurrency, cn } from '@/lib/utils';
import { User, HandCoins, Trash2, Receipt, UserX, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { Badge } from '@/components/ui/badge';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { EMPTY_ARRAY } from '@/lib/constants';

/**
 * Barre d'information spécifique à la vente.
 * Support multi-customer display.
 */
export function SaleInfoBar() {
    const cart      = useActiveCart();
    const pathname  = usePathname();
    const { clearCart } = useCartActions();
    const [isMounted, setIsMounted] = useState(false);

    // Use EMPTY_ARRAY to keep dependencies stable when cart is null or customerUuids is empty
    const selectedUuids = cart?.customerUuids || (EMPTY_ARRAY as string[]);

    const { value: customers } = useLiveQuery<Customer[]>(
        () => selectedUuids.length > 0 
            ? db.customers.where('uuid').anyOf(selectedUuids).toArray() 
            : Promise.resolve(EMPTY_ARRAY as Customer[]),
        [selectedUuids]
    );

    useEffect(() => { 
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const isSellPage = pathname.startsWith('/sell');
    if (!isSellPage || !cart) return null;

    const hasItems  = cart.items.length > 0;
    const { total, discountAmount } = calculateCartTotals(cart);
    const itemCount  = cart.items.reduce((s, i) => s + i.cartQuantity, 0);

    const totalDebt = customers?.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0) || 0;

    return (
        <div className="print-hide info-bar-solid text-sm z-30 border-b border-border shadow-sm">
            <div className="mx-auto grid w-full gap-3 px-4 py-3 sm:px-4 sm:py-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-2 text-foreground">
                        <Receipt className="h-4 w-4 text-primary" />
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-tight truncate">{cart.name}</p>
                            {hasItems && (
                                <Badge variant="secondary" className="mt-1 h-5 px-2 text-[9px] font-black">
                                    {itemCount} ITEMS
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-2 md:justify-center">
                    <div className="rounded-xl border border-border bg-muted px-4 py-3 flex flex-col gap-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">TOTAL NET</p>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-black text-primary tabular-nums tracking-tighter">
                                {formatCurrency(total)}
                            </p>
                            {discountAmount > 0 && (
                                <span className="inline-flex items-center rounded-lg bg-accent px-2 py-0.5 text-[10px] font-black uppercase border border-secondary shadow-sm">
                                    -{formatCurrency(discountAmount)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-muted px-4 py-3 flex items-center justify-between">
                        {customers && customers.length > 0 ? (
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-lg bg-primary text-primary-foreground shadow-sm">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black uppercase text-foreground truncate">
                                        {customers.length === 1 
                                            ? `${customers[0].firstName} ${customers[0].lastName}` 
                                            : `${customers.length} Clients Partagés`}
                                    </p>
                                    <p className={cn("text-[10px] font-bold tabular-nums", totalDebt > 0 ? "text-destructive" : "text-emerald-600")}>
                                        {totalDebt > 0 ? `DETTE TOTALE: ${formatCurrency(totalDebt)}` : "COMPTES SOLDÉS"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground italic">
                                <UserX className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Client de passage</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                    {hasItems && (
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-12 w-12 rounded-xl border-none shadow-sm"
                            onClick={() => clearCart()}
                            title="Vider le panier"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
