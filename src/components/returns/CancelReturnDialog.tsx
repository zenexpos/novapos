'use client';

import { toast } from 'sonner';
import type { ProductReturn } from '@/lib/types';
import { returnService } from '@/services/return.service';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface CancelReturnDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    productReturn: ProductReturn | null;
    onSuccess: () => void;
}

export function CancelReturnDialog({ isOpen, onOpenChange, productReturn, onSuccess }: CancelReturnDialogProps) {
    
    const handleCancel = async () => {
        if (!productReturn) return;
        
        try {
            await returnService.processReturnCancellation(productReturn.uuid);
            toast.success(`Retour sur facture #${productReturn.originalInvoiceNumber} annulé.`);
            onSuccess();
        } catch (error: any) {
            toast.error("Échec de l'annulation.", { description: error.message });
        }
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={`Annuler le retour sur facture #${productReturn?.originalInvoiceNumber} ?`}
            description="Cette action est irréversible. Le stock et le solde client seront mis à jour en conséquence."
            onConfirm={handleCancel}
            confirmText="Confirmer l'annulation"
            cancelText="Retour"
        />
    );
}
