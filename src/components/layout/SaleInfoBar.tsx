'use client';

import { useState, useEffect } from 'react';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import type { Customer } from '@/lib/types';
import { calculateCartTotals, formatCurrency, cn } from '@/lib/utils';
import { User, Receipt, UserX, Trash2, Phone, ShieldAlert, HandCoins } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { toast } from 'sonner';

/**
 * iPOS Zen - Enriched Sale Info Bar.
 * Displays critical cart metrics and detailed customer financial status in real-time.
 */
export function SaleInfoBar() {
    const cart = useActiveCart();
    const pathname = usePathname();
    const { clearCart } = useCartActions();
    const [isMounted, setIsMounted] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    const customerUuid = cart?.customerUuid;

    // Stable query to prevent re-render loops
    const { value: customer, refresh: refreshCustomer } = useLiveQuery<Customer | undefined>(
        () => customerUuid ? db.customers.where('uuid').equals(customerUuid).first() : Promise.resolve(undefined),
        [customerUuid]
    );

    useEffect(() => { setIsMounted(true); }, []);

    if (!isMounted) return null;

    const isSellPage = pathname.startsWith('/sell');
    if (!isSellPage || !cart) return null;

    const { total } = calculateCartTotals(cart);
    const itemCount = cart.items.reduce((s, i) => s + i.cartQuantity, 0);

    const handlePaymentSuccess = () => {
        refreshCustomer();
        toast.success("Règlement enregistré.");
    };

    return (
        <div className="print-hide bg-card border-b border-border shadow-sm z-30 h-12 flex items-center px-4">
            <div className="flex items-center gap-6 w-full">
                {/* 1. Cart Metrics */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Receipt className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col -space-y-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">{cart.name}</span>
                        <span className="text-[10px] font-black text-primary tabular-nums">{formatCurrency(total)}</span>
                    </div>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-black bg-muted border-none ml-1">{itemCount} ITEMS</Badge>
                </div>

                <div className="h-5 w-px bg-border/60 mx-1" />

                {/* 2. Customer Financial Pulse */}
                <div className="flex items-center gap-6 flex-grow min-w-0">
                    {customer ? (
                        <>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                                    <User className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col -space-y-1 min-w-0">
                                    <span className="text-[10px] font-black uppercase truncate text-foreground tracking-tight">
                                        {customer.firstName} {customer.lastName}
                                    </span>
                                    {customer.phone && (
                                        <div className="flex items-center gap-1 opacity-40">
                                            <Phone className="h-2 w-2" />
                                            <span className="text-[8px] font-bold tabular-nums">{customer.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col -space-y-1">
                                    <span className="text-[8px] font-black uppercase text-muted-foreground/40">Crédit Actuel</span>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-xs font-black tabular-nums tracking-tighter",
                                            customer.outstandingBalance > 0.01 ? "text-destructive" : "text-emerald-500"
                                        )}>
                                            {formatCurrency(customer.outstandingBalance)}
                                        </span>
                                        {customer.isOverLimit && (
                                            <div className="flex items-center gap-1 bg-destructive/10 text-destructive px-1.5 py-0.5 rounded border border-destructive/20 animate-pulse">
                                                <ShieldAlert className="h-2.5 w-2.5" />
                                                <span className="text-[7px] font-black uppercase">Bloqué</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {customer.outstandingBalance > 0.01 && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setIsPaymentDialogOpen(true)}
                                        className="h-7 px-3 rounded-lg border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all gap-1.5 font-black text-[9px] uppercase tracking-widest"
                                    >
                                        <HandCoins className="h-3 w-3" />
                                        Encaisser
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2.5 text-muted-foreground/30 italic">
                            <UserX className="h-4 w-4 shrink-0 opacity-20" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Passage (Comptant)</span>
                        </div>
                    )}
                </div>

                {/* 3. Maintenance */}
                <div className="flex items-center gap-2 shrink-0">
                    {cart.items.length > 0 && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-9 w-9 rounded-xl text-destructive/30 hover:text-destructive hover:bg-destructive/5 transition-all"
                            onClick={() => clearCart()}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {customer && (
                <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={customer}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}