'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ReceiptText } from 'lucide-react';
import { DraftsDropdown } from './DraftsDropdown';
import { CustomerCombobox } from './CustomerCombobox';
import { useActiveCart } from '@/stores/cartStore';
import { proformaService } from '@/services/proforma.service';
import { toast } from 'sonner';

interface SaleActionsProps {
    customerComboRef: React.RefObject<{ focusInput: () => void } | null>;
    onOpenPayment: () => void;
}

function SaleActionsContent({ customerComboRef, onOpenPayment }: SaleActionsProps) {
    const cart = useActiveCart();
    const hasItems = !!(cart && cart.items.length > 0);

    const handleCreateProforma = async () => {
        if (!hasItems) return;
        try {
            await proformaService.createProformaFromCart(cart!);
            toast.success("Proforma générée");
        } catch (e) {
            toast.error("Erreur proforma");
        }
    };

    return (
        <div className="flex items-center gap-1.5">
            <DraftsDropdown />
            <CustomerCombobox ref={customerComboRef} />
            <div className="flex-grow" />
            <Button
                variant="outline"
                className="h-8 px-2.5 gap-1.5 border-primary/20 bg-primary/5 text-primary"
                onClick={handleCreateProforma}
                disabled={!hasItems}
            >
                <ReceiptText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[9px] font-black uppercase tracking-tight">Proforma</span>
            </Button>
            <Button
                className="h-10 px-10 font-black text-[12px] uppercase tracking-widest shadow-lg active:scale-95 gap-2"
                onClick={onOpenPayment}
                disabled={!hasItems}
            >
                <Wallet className="h-4 w-4" />
                Finaliser [F10]
            </Button>
        </div>
    );
}

export const SaleActions = memo(SaleActionsContent);
SaleActions.displayName = 'SaleActions';
