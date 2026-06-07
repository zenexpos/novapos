'use client';

import { toast } from 'sonner';
import type { Sale } from '@/lib/types';
import { salesService } from '@/services/sales.service';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface CancelSaleDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sale: Sale | null;
    onSuccess: () => void;
}

export function CancelSaleDialog({ isOpen, onOpenChange, sale, onSuccess }: CancelSaleDialogProps) {
    const handleCancel = async () => {
        if (!sale) return;

        try {
             // The service layer now orchestrates the entire cancellation process.
            await salesService.processSaleCancellation(sale.uuid);
            toast.success(`Vente #${sale.invoiceNumber} annulée.`);
            onSuccess();
        } catch (error: any) {
            toast.error("Échec de l'annulation.", { description: error.message });
        }
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={`Annuler la vente #${sale?.invoiceNumber} ?`}
            description="Cette action est irréversible. Les produits de cette vente seront réintégrés au stock et le solde du client sera mis à jour."
            onConfirm={handleCancel}
            confirmText="Confirmer l'annulation"
            cancelText="Retour"
        />
    );
}
