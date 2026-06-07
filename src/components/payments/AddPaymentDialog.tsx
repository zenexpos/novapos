'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { toast }  from 'sonner';
import { Loader2, Calendar, CheckCircle2, Wallet, AlertTriangle } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { DatePicker }      from '../ui/date-picker';
import { paymentService }  from '@/services/payment.service';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface AddPaymentDialogProps {
    isOpen:           boolean;
    onOpenChange:     (isOpen: boolean) => void;
    customer:         Customer;
    onPaymentSuccess: () => void;
}

export function AddPaymentDialog({
    isOpen,
    onOpenChange,
    customer,
    onPaymentSuccess,
}: AddPaymentDialogProps) {
    const [amount,      setAmount]      = useState('');
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
    const [notes,       setNotes]       = useState('');
    const [isLoading,   setIsLoading]   = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setPaymentDate(new Date());
            setNotes('');
        }
    }, [isOpen]);

    const paymentAmount   = parseFloat(amount) || 0;
    const newBalance      = customer.outstandingBalance - paymentAmount;
    const isFullySettled  = paymentAmount >= customer.outstandingBalance && customer.outstandingBalance > 0;
    const isOverpaying    = paymentAmount > customer.outstandingBalance + 0.01;

    const handlePayAll = () => {
        setAmount(String(customer.outstandingBalance.toFixed(2)));
    };

    const handleAddPayment = async () => {
        if (paymentAmount <= 0) {
            toast.error('Veuillez entrer un montant supérieur à zéro.');
            return;
        }
        if (isOverpaying) {
            toast.error('Montant trop élevé.', {
                description: `Le paiement (${formatCurrency(paymentAmount)}) dépasse la dette actuelle (${formatCurrency(customer.outstandingBalance)}).`,
            });
            return;
        }
        if (!paymentDate) {
            toast.error('Veuillez sélectionner une date de paiement.');
            return;
        }

        setIsLoading(true);
        try {
            await paymentService.addPayment({
                customerUuid: customer.uuid,
                amount:       paymentAmount,
                paymentDate,
                notes:        notes || undefined,
            });
            toast.success(`Paiement de ${formatCurrency(paymentAmount)} enregistré.`);
            onPaymentSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Erreur lors de l'enregistrement.", {
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useKeyboardShortcuts([
        {
            key: 'Enter',
            action: handleAddPayment,
            description: 'Enregistrer le versement client',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer la fenêtre',
            ignoreInputFocus: true
        }
    ], 'Versement', isOpen);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <div className="bg-primary/5 -mx-6 -mt-6 px-6 pt-6 pb-4 border-b border-border mb-4 rounded-t-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Règlement Client
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    {customer.firstName} {customer.lastName}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg border bg-destructive/5">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                Dette actuelle
                            </p>
                            <p className="text-lg font-bold text-destructive tabular-nums">
                                {formatCurrency(customer.outstandingBalance)}
                            </p>
                        </div>
                        <div className={cn(
                            'p-3 rounded-lg border transition-colors',
                            isOverpaying
                                ? 'bg-destructive/10 border-destructive/30'
                                : isFullySettled
                                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30'
                                : 'bg-muted/50',
                        )}>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                Nouveau solde
                            </p>
                            <p className={cn(
                                'text-lg font-bold tabular-nums',
                                isOverpaying    ? 'text-destructive'
                                : isFullySettled ? 'text-emerald-600'
                                : 'text-foreground',
                            )}>
                                {formatCurrency(Math.max(0, newBalance))}
                            </p>
                        </div>
                    </div>

                    {isOverpaying && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            Le montant dépasse la dette du client.
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="pay-amount" className="text-xs font-medium">
                                Montant à encaisser (DA)
                            </Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-primary px-2"
                                onClick={handlePayAll}
                            >
                                Tout régler
                            </Button>
                        </div>
                        <Input
                            id="pay-amount"
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            className={cn(
                                'text-lg font-bold text-center h-10',
                                isOverpaying && 'border-destructive focus-visible:ring-destructive',
                            )}
                            value={amount}
                            onChange={e => {
                                const v = e.target.value;
                                if (/^[0-9]*\.?[0-9]*$/.test(v) || v === '')
                                    setAmount(v);
                            }}
                            onFocus={e => e.target.select()}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Date du paiement
                        </Label>
                        <DatePicker date={paymentDate} setDate={setPaymentDate} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="pay-notes" className="text-xs font-medium">
                            Notes (optionnel)
                        </Label>
                        <Input
                            id="pay-notes"
                            placeholder="Ex: Chèque n°123, espèces…"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="h-9 text-sm"
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleAddPayment}
                            disabled={isLoading || isOverpaying || paymentAmount <= 0}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                            )}
                            Enregistrer
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
