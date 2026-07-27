'use client';

import { useEffect, useRef, useCallback, memo, useState } from 'react';
import { ProductSelector } from '@/components/sell/ProductSearch';
import { CartDisplay } from '@/components/sell/CartDisplay';
import { CartTotalBar } from '@/components/sell/CartTotalBar';
import { SaleActions } from '@/components/sell/SaleActions';
import { useCartActions, useActiveCart } from '@/stores/cartStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { PaymentDialog } from '@/components/sell/PaymentDialog';
import { toast } from 'sonner';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

function SellPageContent() {
    const [isMounted, setIsMounted] = useState(false);
    const cart = useActiveCart();
    const { createCart, clearCart } = useCartActions();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

    const searchInputRef = useRef<{ focusInput: () => void }>(null);
    const customerComboRef = useRef<{ focusInput: () => void }>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const openPayment = useCallback(() => {
        if (cart && cart.items.length > 0) {
            const hasActiveItems = cart.items.some(i => i.cartQuantity > 0);
            if (hasActiveItems) {
                setIsPaymentOpen(true);
            } else {
                toast.error("Veuillez saisir des quantités valides");
            }
        } else {
            toast.error("Le panier est vide");
        }
    }, [cart]);

    const shortcuts = [
        { key: 'F2', action: () => customerComboRef.current?.focusInput(), description: 'Identifier un client', ignoreInputFocus: true },
        { key: 'F3', action: () => searchInputRef.current?.focusInput(), description: 'Rechercher un produit', ignoreInputFocus: true },
        { key: 'F4', action: () => setIsCustomItemOpen(true), description: 'Ajouter un article personnalisé', ignoreInputFocus: true },
        { key: 'F10', action: openPayment, description: 'Finaliser la vente (Payer)', ignoreInputFocus: true },
        { key: 'Backspace', ctrl: true, action: () => { if (cart && cart.items.length > 0) setIsClearConfirmOpen(true); }, description: 'Vider le panier', ignoreInputFocus: true },
        { key: 'w', ctrl: true, action: () => { createCart(); toast.success('Nouveau panier créé.'); }, description: 'Vente suspendue', ignoreInputFocus: true }
    ];

    useKeyboardShortcuts(shortcuts, 'Vente');

    if (!isMounted) return null;

    return (
        <div className="h-full flex flex-col p-0.5 gap-0.5 overflow-hidden bg-background">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0.5 flex-grow min-h-0">
                {/* Cart panel (7/12) */}
                <div className="lg:col-span-7 flex flex-col bg-card border-r overflow-hidden min-h-0 shadow-sm">
                    <CartDisplay />
                    <div className="mt-auto p-3 space-y-3 border-t bg-muted/10">
                        <CartTotalBar />
                        <SaleActions 
                            customerComboRef={customerComboRef}
                            onOpenPayment={openPayment}
                        />
                    </div>
                </div>

                {/* Product search panel (5/12) */}
                <div className="lg:col-span-5 flex flex-col min-h-0 bg-card overflow-hidden">
                    <ProductSelector 
                        ref={searchInputRef} 
                        isCustomItemOpen={isCustomItemOpen}
                        onCustomItemOpenChange={setIsCustomItemOpen}
                    />
                </div>
            </div>

            <PaymentDialog isOpen={isPaymentOpen} onOpenChange={setIsPaymentOpen} />
            
            <ConfirmAlertDialog
                isOpen={isClearConfirmOpen}
                onOpenChange={setIsClearConfirmOpen}
                title="Vider le panier ?"
                description="Tous les articles de la vente en cours seront supprimés."
                onConfirm={async () => {
                    clearCart();
                    toast.success("Panier vidé");
                }}
                confirmText="Vider"
            />
        </div>
    );
}

const SellPage = memo(SellPageContent);
SellPage.displayName = 'SellPage';
export default SellPage;
