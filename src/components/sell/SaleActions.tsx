'use client';

import React, { memo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ReceiptText } from 'lucide-react';
import { DraftsDropdown } from './DraftsDropdown';
import { CustomerCombobox } from './CustomerCombobox';
import { useActiveCart } from '@/stores/cartStore';
import { proformaService } from '@/services/proforma.service';
import { ProformaDialog } from './ProformaDialog';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import type { ProformaInvoice, Customer } from '@/lib/types';
import { db } from '@/lib/db';

interface SaleActionsProps {
    customerComboRef: React.RefObject<{ focusInput: () => void } | null>;
    onOpenPayment: () => void;
}

/**
 * iPOS Zen - Sale Actions Console.
 * Orchestrates Cart Drafts, Customer selection and Proforma generation.
 */
function SaleActionsContent({ customerComboRef, onOpenPayment }: SaleActionsProps) {
    const cart = useActiveCart();
    const profile = useAppStore(state => state.companyProfile);
    const [isProformaOpen, setIsProformaOpen] = useState(false);
    const [lastProforma, setLastProforma] = useState<ProformaInvoice | null>(null);
    const [customerName, setCustomerName] = useState<string | undefined>(undefined);

    const hasItems = !!(cart && cart.items.length > 0);

    // Resolve current customer name for proforma display
    useEffect(() => {
        if (cart?.customerUuid) {
            db.customers.where('uuid').equals(cart.customerUuid).first().then(c => {
                if (c) setCustomerName(`${c.firstName} ${c.lastName}`);
                else setCustomerName(undefined);
            });
        } else {
            setCustomerName(undefined);
        }
    }, [cart?.customerUuid]);

    const handleCreateProforma = async () => {
        if (!hasItems) return;
        try {
            const proforma = await proformaService.createProformaFromCart(cart!);
            setLastProforma(proforma);
            setIsProformaOpen(true);
            toast.success("Proforma générée avec succès");
        } catch (e) {
            toast.error("Erreur lors de la génération de la proforma");
        }
    };

    return (
        <div className="flex items-center gap-1.5">
            <DraftsDropdown />
            <CustomerCombobox ref={customerComboRef} />
            <div className="flex-grow" />
            <Button
                variant="outline"
                className="h-8 px-2.5 gap-1.5 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all"
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

            <ProformaDialog 
                isOpen={isProformaOpen} 
                onOpenChange={setIsProformaOpen} 
                proforma={lastProforma}
                profile={profile}
                customerName={customerName}
            />
        </div>
    );
}

export const SaleActions = memo(SaleActionsContent);
SaleActions.displayName = 'SaleActions';
