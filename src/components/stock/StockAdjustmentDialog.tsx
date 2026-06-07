'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button }               from '@/components/ui/button';
import { Label }                from '@/components/ui/label';
import { Input }                from '@/components/ui/input';
import { ProductIntakeCombobox } from './ProductIntakeCombobox';
import type { Product }         from '@/lib/types';
import { inventoryService }     from '@/services/inventory.service';
import { toast }                from 'sonner';
import { Loader2, ArrowUpDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn }                   from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface StockAdjustmentDialogProps {
    isOpen:       boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess:    () => void;
}

export function StockAdjustmentDialog({
    isOpen,
    onOpenChange,
    onSuccess,
}: StockAdjustmentDialogProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [adjustment,      setAdjustment]      = useState<string>('');
    const [isLoading,       setIsLoading]       = useState(false);

    const resetForm = () => {
        setSelectedProduct(null);
        setAdjustment('');
    };

    const handleSave = async () => {
        const change = parseFloat(adjustment);

        if (!selectedProduct) {
            toast.error('Veuillez sélectionner un produit.');
            return;
        }
        if (isNaN(change) || change === 0) {
            toast.error('Veuillez entrer une variation valide (ex: -5 ou +2.5).');
            return;
        }
        if (selectedProduct.quantity + change < 0) {
            toast.error('Le stock ne peut pas devenir négatif.');
            return;
        }

        setIsLoading(true);
        try {
            await inventoryService.adjustStock(
                selectedProduct.uuid,
                change,
                'manual_adjustment',
            );
            toast.success('Stock ajusté avec succès.');
            onSuccess();
            onOpenChange(false);
            resetForm();
        } catch (error: any) {
            toast.error("Erreur lors de l'ajustement.", {
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
            description: 'Appliquer l\'ajustement de stock',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer la fenêtre',
            ignoreInputFocus: true
        }
    ], 'CorrectionStock', isOpen);

    const changeVal  = parseFloat(adjustment) || 0;
    const finalStock = selectedProduct
        ? Number((selectedProduct.quantity + changeVal).toFixed(3))
        : 0;

    return (
        <Dialog
            open={isOpen}
            onOpenChange={open => {
                onOpenChange(open);
                if (!open) resetForm();
            }}
        >
            <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
                <div className="bg-primary/5 p-4 border-b border-border">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                                <ArrowUpDown className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Correction de Stock
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Ajustez le stock sans facture (perte, don, erreur…)
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            1. Produit
                        </Label>
                        <ProductIntakeCombobox
                            onProductSelected={p => setSelectedProduct(p)}
                            onNewProductCreated={() => {}}
                        />
                    </div>

                    {selectedProduct && (
                        <div className="space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                                <span className="text-sm font-semibold">
                                    {selectedProduct.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Stock actuel:</span>
                                    <span className="font-bold text-sm px-2 py-0.5 bg-background rounded-md border border-border">
                                        {selectedProduct.quantity}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="adj-qty"
                                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                    2. Variation (ex: -5 ou +2.5)
                                </Label>
                                <Input
                                    id="adj-qty"
                                    type="number"
                                    step="0.001"
                                    placeholder="0"
                                    className="h-10 text-lg font-bold text-center"
                                    value={adjustment}
                                    onChange={e => setAdjustment(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex items-center gap-1.5">
                                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-[11px] text-muted-foreground">
                                        Utilisez « - » pour les pertes ou corrections en baisse.
                                    </p>
                                </div>
                            </div>

                            {adjustment && changeVal !== 0 && (
                                <div
                                    className={cn(
                                        'flex justify-between items-center p-3 rounded-lg border-2 border-dashed transition-colors',
                                        changeVal > 0
                                            ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-600'
                                            : 'bg-destructive/5 border-destructive/30 text-destructive',
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wide">
                                            Stock final
                                        </span>
                                    </div>
                                    <span className="text-xl font-bold tabular-nums">
                                        {finalStock}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
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
                        disabled={
                            isLoading ||
                            !selectedProduct ||
                            !adjustment ||
                            changeVal === 0
                        }
                    >
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Appliquer [Enter]
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
