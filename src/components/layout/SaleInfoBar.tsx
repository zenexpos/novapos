'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/lib/types';
import { calculateCartTotals, formatCurrency, cn } from '@/lib/utils';
import { User, HandCoins, Trash2, Receipt, UserX } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { Badge } from '@/components/ui/badge';

export function SaleInfoBar() {
    const cart      = useActiveCart();
    const pathname  = usePathname();
    const { clearCart } = useCartActions();

    const [customer, setCustomer]               = useState<Customer | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const fetchCustomer = useCallback(async () => {
        if (cart?.customerUuid) {
            const c = await customerService.getCustomerByUuid(cart.customerUuid).catch(() => null);
            setCustomer(c || null);
        } else {
            setCustomer(null);
        }
    }, [cart?.customerUuid]);

    useEffect(() => { 
        setIsMounted(true);
        fetchCustomer(); 
    }, [fetchCustomer]);

    if (!isMounted) return null;

    const hasItems  = !!(cart && cart.items.length > 0);
    const hasCustomer = !!cart?.customerUuid;
    const isSellPage = pathname === '/sell';

    if (!cart || (!hasItems && !isSellPage && !hasCustomer)) return null;

    const { total, discountAmount } = calculateCartTotals(cart);
    const itemCount  = cart.items.reduce((s, i) => s + i.cartQuantity, 0);
    const customerDebt = customer?.outstandingBalance ?? 0;

    return (
        <>
            <div className="print-hide border-b-2 border-secondary bg-card text-sm z-30">
                <div className="mx-auto grid w-full gap-3 px-4 py-3 sm:px-4 sm:py-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                    {/* Session badge */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center gap-1.5 rounded-xl border-2 border-secondary bg-muted px-3 py-2 text-secondary">
                            <Receipt className="h-4 w-4" />
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
                        <div className="rounded-xl border-2 border-secondary bg-muted px-4 py-3 flex flex-col gap-1">
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

                        <div className="rounded-xl border-2 border-secondary bg-muted px-4 py-3 flex items-center justify-between">
                            {customer ? (
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 rounded-lg bg-primary/20 text-primary border border-primary">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <Link
                                            href={`/customers/detail?uuid=${customer.uuid}`}
                                            className="block truncate text-sm font-black uppercase text-secondary hover:text-primary transition-colors"
                                        >
                                            {customer.firstName} {customer.lastName}
                                        </Link>
                                        <p className={cn("text-[10px] font-bold tabular-nums", customerDebt > 0 ? "text-destructive" : "text-emerald-600")}>
                                            {customerDebt > 0 ? `DETTE: ${formatCurrency(customerDebt)}` : "COMPTE SOLDE"}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-muted-foreground italic">
                                    <UserX className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Client de passage</span>
                                </div>
                            )}
                            {customer && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-card hover:bg-secondary hover:text-white border-2 border-secondary"
                                    onClick={() => setIsPaymentDialogOpen(true)}
                                >
                                    <HandCoins className="h-4 w-4 mr-2" />
                                    Régler
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        {hasItems && (
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-12 w-12 rounded-xl border-2 border-secondary shadow-sm"
                                onClick={() => clearCart()}
                                title="Vider le panier"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {customer && (
                <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={customer}
                    onPaymentSuccess={fetchCustomer}
                />
            )}
        </>
    );
}