'use client';

import { toast } from 'sonner';
import type { StockIntake } from '@/lib/types';
import { stockService } from '@/services/stock.service';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface CancelIntakeDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    intake: StockIntake | null;
    onSuccess: () => void;
}

export function CancelIntakeDialog({ isOpen, onOpenChange, intake, onSuccess }: CancelIntakeDialogProps) {
    const handleCancel = async () => {
        if (!intake) return;
        
        await stockService.processStockIntakeCancellation(intake.uuid);
        toast.success(`Réception de ${intake.invoiceNumber || 'stock'} annulée.`);
        onSuccess();
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={`Annuler la réception de stock ${intake?.invoiceNumber || ''} ?`}
            description="Cette action est irréversible. Le stock des produits et le solde du fournisseur seront restaurés à leur état précédent."
            onConfirm={handleCancel}
            confirmText="Confirmer l'annulation"
            cancelText="Retour"
        />
    );
}
