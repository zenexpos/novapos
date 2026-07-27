'use client';

import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Switch }   from '@/components/ui/switch';
import { Badge }    from '@/components/ui/badge';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import {
    calculateCartTotals, formatCurrency,
    cn, FINANCIAL_EPSILON, safeNumber, roundFinancial
} from '@/lib/utils';
import {
    Loader2, CheckCircle2, AlertCircle,
    Wallet, ShieldAlert, UserX, UserCheck,
    Truck
} from 'lucide-react';
import { PrintReceiptDialog } from '../sales/PrintReceiptDialog';
import type { Sale, Customer } from '@/lib/types';
import { DatePicker }       from '../ui/date-picker';
import { addDays, setDate as fnsSetDate, addMonths, isAfter, startOfDay } from 'date-fns';
import { customerService }  from '@/services/customer.service';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

/**
 * iPOS Zen - Audit Encaissement (Elite Logic).
 * Includes Delivery Fee management.
 */
function PaymentDialogContent({
    isOpen,
    onOpenChange,
}: {
    isOpen:       boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const isMountedRef     = useRef(true);
    const cart             = useActiveCart();
    const { processSale, setDeliveryFee }  = useCartActions();

    const [amountPaidStr,   setAmountPaidStr]   = useState('0');
    const [deliveryFeeStr,  setDeliveryFeeStr]  = useState('0');
    const [dueDate,         setDueDate]         = useState<Date | undefined>();
    const [isLoading,       setIsLoading]       = useState(false);
    const [lastSale,        setLastSale]        = useState<Sale | null>(null);
    const [isReceiptOpen,   setIsReceiptOpen]   = useState(false);
    const [customer,        setCustomer]        = useState<Customer | null>(null);
    const [approveOverLimit, setApproveOverLimit] = useState(false);

    const activeItems = useMemo(() => cart?.items.filter(i => i.cartQuantity > 0) || [], [cart?.items]);
    const customerUuid = cart?.customerUuid;

    const totals = useMemo(
        () => (cart ? calculateCartTotals({ ...cart, items: activeItems }) : { total: 0, subtotal: 0, deliveryFee: 0, discountAmount: 0 }),
        [cart, activeItems]
    );

    const total = totals.total;
    const amountPaid   = roundFinancial(safeNumber(amountPaidStr));
    const change       = roundFinancial(Math.max(0, amountPaid - total));
    
    const isFullPay    = amountPaid >= total - FINANCIAL_EPSILON;
    const isCreditSale = !!(customerUuid && amountPaid < total - FINANCIAL_EPSILON);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (!isOpen || !cart) return;
        
        const currentTotals = calculateCartTotals({ ...cart, items: activeItems });
        setAmountPaidStr(currentTotals.total.toFixed(2));
        setDeliveryFeeStr(currentTotals.deliveryFee.toString());
        setIsLoading(false);
        setLastSale(null);
        setApproveOverLimit(false);

        if (customerUuid) {
            customerService.getCustomerByUuid(customerUuid).then(c => {
                if (!isMountedRef.current) return;
                setCustomer(c || null);
                const now = new Date();
                if (c?.settlementDay) {
                    let targetDate = fnsSetDate(new Date(now), c.settlementDay);
                    if (isAfter(startOfDay(now), startOfDay(targetDate))) targetDate = addMonths(targetDate, 1);
                    setDueDate(targetDate);
                } else {
                    setDueDate(addDays(now, 30));
                }
            });
        } else {
            setDueDate(undefined);
            setCustomer(null);
        }
    }, [isOpen, cart, activeItems, customerUuid]);

    const projectedBalance = useMemo(() => {
        if (!customer) return 0;
        return roundFinancial((customer.outstandingBalance || 0) + Math.max(0, total - amountPaid));
    }, [customer, total, amountPaid]);

    const isOverLimit = useMemo(() => {
        if (!customer?.creditLimit) return false;
        return projectedBalance > (customer.creditLimit + FINANCIAL_EPSILON);
    }, [customer, projectedBalance]);

    const canFinalize = !isLoading && amountPaid >= 0 && (isFullPay || (customerUuid && (!isOverLimit || approveOverLimit)));

    const handleProcessSale = useCallback(async () => {
        if (!canFinalize) return;
        setIsLoading(true);
        try {
            const sale = await processSale(amountPaid, dueDate);
            if (sale && isMountedRef.current) {
                setLastSale(sale);
                onOpenChange(false);
                setTimeout(() => { if (isMountedRef.current) setIsReceiptOpen(true); }, 200); 
            }
        } finally {
            if (isMountedRef.current) setIsLoading(false);
        }
    }, [amountPaid, dueDate, processSale, onOpenChange, canFinalize]);

    const updateDeliveryFee = (val: string) => {
        setDeliveryFeeStr(val);
        setDeliveryFee(safeNumber(val));
        // Auto-update amount paid if it was matching the previous total
        if (Math.abs(amountPaid - total) < FINANCIAL_EPSILON) {
             const newTotals = calculateCartTotals({ ...cart!, deliveryFee: safeNumber(val), items: activeItems });
             setAmountPaidStr(newTotals.total.toFixed(2));
        }
    };

    useKeyboardShortcuts([
        { key: 'Enter', action: handleProcessSale, description: "Valider l'encaissement", ignoreInputFocus: true },
        { key: 'Escape', action: () => onOpenChange(false), description: 'Annuler', ignoreInputFocus: true }
    ], 'Encaissement', isOpen);

    if (!cart) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading) onOpenChange(open); }}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                    <DialogHeader className="p-6 bg-muted border-b border-border">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg"><Wallet className="h-6 w-6" /></div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight uppercase">Audit Encaissement</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase text-primary/50 tracking-widest">{cart.name}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="p-6 bg-muted rounded-2xl border border-border text-center space-y-1 shadow-inner relative overflow-hidden group">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] relative z-10">Total Net à Percevoir</p>
                            <p className="text-4xl font-black text-primary tabular-nums tracking-tighter relative z-10">{formatCurrency(total)}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount-paid" className="text-[10px] font-black uppercase text-muted-foreground/60 ml-1">Montant Reçu (DA)</Label>
                                <Input
                                    id="amount-paid"
                                    type="text"
                                    inputMode="decimal"
                                    className="h-14 rounded-2xl bg-muted border-none shadow-inner text-2xl font-black text-center focus-visible:ring-primary/20"
                                    value={amountPaidStr}
                                    onChange={e => { if (/^[0-9]*\.?[0-9]*$/.test(e.target.value) || e.target.value === '') setAmountPaidStr(e.target.value); }}
                                    autoFocus
                                    onFocus={e => e.target.select()}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="delivery-fee" className="text-[10px] font-black uppercase text-primary/60 ml-1 flex items-center gap-1.5"><Truck className="h-3 w-3" /> سعر التوصيل</Label>
                                <Input
                                    id="delivery-fee"
                                    type="text"
                                    inputMode="decimal"
                                    className="h-14 rounded-2xl bg-primary/5 border-none shadow-inner text-2xl font-black text-center text-primary focus-visible:ring-primary/20"
                                    value={deliveryFeeStr}
                                    onChange={e => { if (/^[0-9]*\.?[0-9]*$/.test(e.target.value) || e.target.value === '') updateDeliveryFee(e.target.value); }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground/60 ml-1">Reliquat Monnaie</Label>
                           <div className={cn('flex-grow h-10 flex items-center justify-center rounded-xl border-2 border-dashed text-lg font-black tabular-nums transition-all', change >= 0.01 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-sm' : 'bg-muted border-border text-muted-foreground/20')}>
                                {change >= 0.01 ? formatCurrency(change) : '0.00'}
                            </div>
                        </div>

                        <div className={cn("p-4 rounded-2xl border flex items-center gap-4 transition-all duration-500", customer ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-amber-500/5 border-amber-500/20")}>
                            <div className={cn("p-2.5 rounded-xl shadow-inner", customer ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-500")}>
                                {customer ? <UserCheck className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Affectation Client</p>
                                <p className="text-sm font-bold tracking-tight truncate">{customer ? `${customer.firstName} ${customer.lastName}` : "Client de passage"}</p>
                            </div>
                            {!customer && !isFullPay && <Badge variant="destructive" className="h-6 px-3 rounded-lg animate-pulse uppercase text-[8px] font-black">Encaissement requis</Badge>}
                        </div>

                        {isCreditSale && customer && (
                            <div className="space-y-4 p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl animate-in zoom-in-95 duration-500">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                                    <p className="text-amber-700 text-xs font-medium leading-relaxed">
                                        Transfert de <span className="font-black underline">{formatCurrency(total - amountPaid)}</span> au registre des dettes.
                                    </p>
                                </div>
                                {isOverLimit && (
                                    <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3 shadow-inner">
                                        <div className="flex items-center gap-2 text-destructive text-[10px] font-black uppercase tracking-wide"><ShieldAlert className="h-4 w-4" />Plafンド Dépassé</div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Autoriser exception</span>
                                            <Switch checked={approveOverLimit} onCheckedChange={setApproveOverLimit} className="data-[state=checked]:bg-destructive" />
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground/40 ml-1">Échéance</Label>
                                    <DatePicker date={dueDate} setDate={setDueDate} />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 bg-muted border-t border-border flex gap-3">
                        <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest" onClick={() => onOpenChange(false)} disabled={isLoading}>Réviser</Button>
                        <Button className="flex-[2] h-12 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl gap-3 active:scale-95 transition-all" onClick={handleProcessSale} disabled={!canFinalize}>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} 
                            Valider [Enter]
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PrintReceiptDialog isOpen={isReceiptOpen} onOpenChange={setIsReceiptOpen} sale={lastSale} customerName={customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'} />
        </>
    );
}

export const PaymentDialog = memo(PaymentDialogContent);
PaymentDialog.displayName = 'PaymentDialog';
