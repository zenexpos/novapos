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

    // Show Infobar if: has items OR we are on sell page OR a customer is selected
    if (!cart || (!hasItems && !isSellPage && !hasCustomer)) return null;

    const { total, discountAmount } = calculateCartTotals(cart);
    const itemCount  = cart.items.reduce((s, i) => s + i.cartQuantity, 0);
    const customerDebt = customer?.outstandingBalance ?? 0;

    return (
        <>
            <div className="print-hide border-b border-border bg-muted text-sm z-30">
                <div className="mx-auto grid w-full gap-3 px-4 py-3 sm:px-4 sm:py-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                    {/* Session badge */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-2 text-muted-foreground">
                            <Receipt className="h-3.5 w-3.5" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{cart.name}</p>
                                {hasItems && (
                                    <Badge variant="secondary" className="mt-1 h-5 px-2 text-[11px]">
                                        {itemCount} article{itemCount > 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-2 md:justify-center">
                        <div className="rounded-2xl border border-border bg-background px-3 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                                    Total
                                </p>
                                <p className="mt-1 text-xl font-black text-primary tabular-nums tracking-tighter">
                                    {formatCurrency(total)}
                                </p>
                            </div>
                            {discountAmount > 0 && (
                                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-500">
                                    -{formatCurrency(discountAmount)}
                                </span>
                            )}
                        </div>

                        <div className="rounded-2xl border border-border bg-background px-3 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            {customer ? (
                                <div className="flex items-center gap-2 min-w-0">
                                    <User className="h-4 w-4 text-primary shrink-0" />
                                    <div className="min-w-0">
                                        <Link
                                            href={`/customers/detail?uuid=${customer.uuid}`}
                                            className="block truncate text-sm font-semibold text-foreground hover:text-primary transition-colors"
                                        >
                                            {customer.firstName} {customer.lastName}
                                        </Link>
                                        {customerDebt > 0 ? (
                                            <p className="mt-0.5 text-[12px] font-bold text-destructive tabular-nums">
                                                {formatCurrency(customerDebt)}
                                            </p>
                                        ) : (
                                            <p className="mt-0.5 text-[12px] text-muted-foreground/70">Solde à jour</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-muted-foreground/70 italic">
                                    <UserX className="h-4 w-4 shrink-0" />
                                    <span className="text-sm font-medium">Client de passage</span>
                                </div>
                            )}
                            {customer && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 px-3 text-sm text-destructive hover:bg-destructive/10"
                                    onClick={() => setIsPaymentDialogOpen(true)}
                                >
                                    <HandCoins className="h-4 w-4 mr-2" />
                                    Régler
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 md:justify-end">
                        {hasItems && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => clearCart()}
                                title="Vider le panier"
                            >
                                <Trash2 className="h-4.5 w-4.5" />
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