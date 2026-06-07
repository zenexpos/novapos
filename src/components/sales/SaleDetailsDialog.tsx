'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button }    from '@/components/ui/button';
import { Badge }     from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import type { Sale, Customer } from '@/lib/types';
import { format } from 'date-fns';
import { fr }     from 'date-fns/locale';
import {
    FileText, User, Calendar, Package, Tag,
    TrendingUp, CreditCard, Printer, X,
} from 'lucide-react';
import { db } from '@/lib/db';
import { PrintReceiptDialog } from './PrintReceiptDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface SaleDetailsDialogProps {
    isOpen:       boolean;
    onOpenChange: (open: boolean) => void;
    sale:         Sale | null;
}

export function SaleDetailsDialog({
    isOpen,
    onOpenChange,
    sale,
}: SaleDetailsDialogProps) {
    const [customer,        setCustomer]        = useState<Customer | null>(null);
    const [isPrintOpen,     setIsPrintOpen]     = useState(false);

    useEffect(() => {
        if (!sale?.customerUuid) { setCustomer(null); return; }
        db.customers
            .where('uuid')
            .equals(sale.customerUuid)
            .first()
            .then(c => setCustomer(c || null));
    }, [sale]);

    const margin = useMemo(() => {
        if (!sale) return 0;
        const cogs = sale.items.reduce(
            (sum, item) =>
                sum + Number(item.purchasePrice || 0) * Number(item.quantity),
            0,
        );
        return sale.total - cogs;
    }, [sale]);

    // Raccourcis pour les détails de vente
    useKeyboardShortcuts([
        {
            key: 'p',
            ctrl: true,
            action: () => setIsPrintOpen(true),
            description: 'Imprimer la facture',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer',
            ignoreInputFocus: true
        }
    ], 'DétailsVente', isOpen);

    if (!sale) return null;

    const statusLabel =
        sale.paymentStatus === 'paid'    ? 'Soldée' :
        sale.paymentStatus === 'partial' ? 'Partiellement payée' :
        'Impayée';

    const statusClass =
        sale.paymentStatus === 'paid'    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
        sale.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
        'bg-destructive/10 text-destructive';

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
                    <div className="p-4 border-b border-border bg-primary/5">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <DialogTitle className="text-base font-semibold">
                                        Facture #{sale.invoiceNumber}
                                    </DialogTitle>
                                </div>
                                <Badge className={cn('text-xs font-semibold', statusClass)}>
                                    {statusLabel}
                                </Badge>
                            </div>
                            <DialogDescription className="text-xs mt-1">
                                {format(safeToDate(sale.createdAt!), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <ScrollArea className="flex-1 overflow-auto">
                        <div className="p-4 space-y-4">
                            {customer && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Client</p>
                                        <p className="text-sm font-semibold">
                                            {customer.firstName} {customer.lastName}
                                        </p>
                                    </div>
                                    {sale.dueDate && (
                                        <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-600">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Échéance: {format(safeToDate(sale.dueDate), 'dd/MM/yyyy')}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Articles ({sale.items.length})
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left p-2 text-xs font-semibold text-muted-foreground">Article</th>
                                                <th className="text-center p-2 text-xs font-semibold text-muted-foreground w-14">Qté</th>
                                                <th className="text-right p-2 text-xs font-semibold text-muted-foreground w-20">P.U</th>
                                                <th className="text-right p-2 text-xs font-semibold text-muted-foreground w-24">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {sale.items.map((item, i) => (
                                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-2 font-medium text-sm">{item.name}</td>
                                                    <td className="p-2 text-center font-mono text-sm">{item.quantity}</td>
                                                    <td className="p-2 text-right font-mono text-sm">{Number(item.price).toFixed(2)}</td>
                                                    <td className="p-2 text-right font-bold font-mono text-sm">{(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="rounded-lg border border-border p-3 space-y-2">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Récapitulatif</p>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Sous-total</span>
                                    <span className="font-mono">{formatCurrency(sale.subtotal)}</span>
                                </div>
                                {sale.discountAmount && sale.discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600">
                                        <span>Remise</span>
                                        <span className="font-mono">-{formatCurrency(sale.discountAmount)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total Net</span>
                                    <span className="font-mono text-primary">{formatCurrency(sale.total)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Reçu</span>
                                    <span className="font-mono font-semibold">{formatCurrency(sale.amountPaid)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold">
                                    <span>{sale.remainingBalance > 0.01 ? 'Solde dû (dette)' : 'Monnaie rendue'}</span>
                                    <span className={cn('font-mono', sale.remainingBalance > 0.01 ? 'text-destructive' : 'text-emerald-600')}>
                                        {formatCurrency(Math.abs(sale.remainingBalance))}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Marge brute</span>
                                    <span className={cn('font-mono font-semibold', margin >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                                        {formatCurrency(margin)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <div className="p-3 border-t border-border flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-1" />Fermer [Esc]</Button>
                        <Button size="sm" className="flex-1" onClick={() => setIsPrintOpen(true)}><Printer className="h-4 w-4 mr-1" />Imprimer [Ctrl+P]</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <PrintReceiptDialog
                isOpen={isPrintOpen}
                onOpenChange={setIsPrintOpen}
                sale={sale}
                customerName={customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'}
            />
        </>
    );
}