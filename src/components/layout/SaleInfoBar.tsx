'use client';

import { useState, useEffect } from 'react';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import type { Customer } from '@/lib/types';
import { calculateCartTotals, formatCurrency, cn } from '@/lib/utils';
import { User, Receipt, UserX, Trash2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';

export function SaleInfoBar() {
    const cart = useActiveCart();
    const pathname = usePathname();
    const { clearCart } = useCartActions();
    const [isMounted, setIsMounted] = useState(false);

    const customerUuid = cart?.customerUuid;

    const { value: customer } = useLiveQuery<Customer | undefined>(
        () => customerUuid ? db.customers.where('uuid').equals(customerUuid).first() : Promise.resolve(undefined),
        [customerUuid]
    );

    useEffect(() => { setIsMounted(true); }, []);

    if (!isMounted) return null;

    const isSellPage = pathname.startsWith('/sell');
    if (!isSellPage || !cart) return null;

    const { total } = calculateCartTotals(cart);
    const itemCount = cart.items.reduce((s, i) => s + i.cartQuantity, 0);

    return (
        <div className="print-hide bg-card border-b border-border shadow-sm z-30 h-12 flex items-center px-4">
            <div className="flex items-center gap-6 w-full">
                {/* Cart Info */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Receipt className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[120px]">{cart.name}</span>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-bold bg-muted">{itemCount} ITEMS</Badge>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Shared Total Display - Compact */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col -space-y-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground/40">Total Net</span>
                        <span className="text-lg font-black text-primary tabular-nums tracking-tighter">{formatCurrency(total)}</span>
                    </div>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Customer Display - Ultra Compact */}
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    {customer ? (
                        <div className="flex items-center gap-2 min-w-0">
                            <User className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                            <span className="text-[10px] font-black uppercase truncate text-muted-foreground">
                                {customer.firstName} {customer.lastName}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground/30 italic">
                            <UserX className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Client de passage</span>
                        </div>
                    )}
                </div>

                {/* Fast Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {cart.items.length > 0 && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/5"
                            onClick={() => clearCart()}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
