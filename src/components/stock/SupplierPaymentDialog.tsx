'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Label }    from '@/components/ui/label';
import { Input }    from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Supplier }    from '@/lib/types';
import { supplierService }  from '@/services/supplier.service';
import { toast }            from 'sonner';
import { Loader2, HandCoins, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface SupplierPaymentDialogProps {
    isOpen:       boolean;
    onOpenChange: (open: boolean) => void;
    supplier:     Supplier | null;
    onSuccess:    () => void;
}

export function SupplierPaymentDialog({
    isOpen,
    onOpenChange,
    supplier,
    onSuccess,
}: SupplierPaymentDialogProps) {
    const [amount,      setAmount]      = useState('');
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
    const [method,      setMethod]      = useState<'cash' | 'check' | 'transfer'>('cash');
    const [notes,       setNotes]       = useState('');
    const [isLoading,   setIsLoading]   = useState(false);

    const handleSave = async () => {
        const amountNum = parseFloat(amount);
        if (!supplier) return;

        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error('Veuillez entrer un montant valide.');
            return;
        }

        if (amountNum > supplier.balance + 0.01) {
            toast.error('Montant trop élevé.', {
                description: `Le paiement (${formatCurrency(amountNum)}) dépasse la dette actuelle (${formatCurrency(supplier.balance)}).`,
            });
            return;
        }

        if (!paymentDate) {
            toast.error('Veuillez sélectionner une date.');
            return;
        }

        setIsLoading(true);
        try {
            await supplierService.processSupplierPayment({
                supplierUuid: supplier.uuid,
                amount:       amountNum,
                paymentDate,
                method,
                notes:        notes || undefined,
            });
            toast.success('Paiement fournisseur enregistré.');
            onSuccess();
            onOpenChange(false);
            setAmount('');
            setNotes('');
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
            action: handleSave,
            description: 'Enregistrer le versement fournisseur',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer la fenêtre',
            ignoreInputFocus: true
        }
    ], 'Fournisseur', isOpen);

    if (!supplier) return null;

    const parsedAmount      = parseFloat(amount) || 0;
    const remainingBalance  = supplier.balance - parsedAmount;
    const isOverpaying      = parsedAmount > supplier.balance + 0.01;
    const isFullySettled    = parsedAmount >= supplier.balance && supplier.balance > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
                <div className="bg-primary/5 p-4 border-b border-border">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                                <HandCoins className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Règlement Fournisseur
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    {supplier.name}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg border bg-destructive/5">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                Dette actuelle
                            </p>
                            <p className="text-lg font-bold text-destructive tabular-nums">
                                {formatCurrency(supplier.balance)}
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
                                Solde après
                            </p>
                            <p className={cn(
                                'text-lg font-bold tabular-nums',
                                isOverpaying
                                    ? 'text-destructive'
                                    : isFullySettled
                                    ? 'text-emerald-600'
                                    : 'text-foreground',
                            )}>
                                {formatCurrency(Math.max(0, remainingBalance))}
                            </p>
                        </div>
                    </div>

                    {isOverpaying && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            Le montant dépasse la dette fournisseur.
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="sup-pay-amt" className="text-xs font-semibold">
                                Montant à verser (DA)
                            </Label>
                            <button
                                className="text-xs text-primary font-medium hover:underline"
                                onClick={() => setAmount(supplier.balance.toFixed(2))}
                                type="button"
                            >
                                Tout régler
                            </button>
                        </div>
                        <Input
                            id="sup-pay-amt"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className={cn(
                                'h-10 text-lg font-bold text-center',
                                isOverpaying && 'border-destructive focus-visible:ring-destructive',
                            )}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Mode de paiement</Label>
                            <Select
                                value={method}
                                onValueChange={(v: any) => setMethod(v)}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Espèces</SelectItem>
                                    <SelectItem value="check">Chèque</SelectItem>
                                    <SelectItem value="transfer">Virement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Date</Label>
                            <DatePicker date={paymentDate} setDate={setPaymentDate} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="sup-pay-notes" className="text-xs font-semibold">
                            Référence / Notes
                        </Label>
                        <Input
                            id="sup-pay-notes"
                            placeholder="N° chèque, virement…"
                            className="h-9 text-sm"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-border flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => onOpenChange(false)}
                    >
                        Annuler
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleSave}
                        disabled={isLoading || !amount || parsedAmount <= 0 || isOverpaying}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Enregistrer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
