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
    const { createCart, clearCart, selectCart } = useCartActions();
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
        {
            key: 'F2',
            action: () => customerComboRef.current?.focusInput(),
            description: 'Identifier un client',
            ignoreInputFocus: true
        },
        {
            key: 'F3',
            action: () => searchInputRef.current?.focusInput(),
            description: 'Rechercher un produit',
            ignoreInputFocus: true
        },
        {
            key: 'F4',
            action: () => setIsCustomItemOpen(true),
            description: 'Ajouter un article personnalisé',
            ignoreInputFocus: true
        },
        {
            key: 'F10',
            action: openPayment,
            description: 'Finaliser la vente (Payer)',
            ignoreInputFocus: true
        },
        {
            key: ' ',
            action: () => searchInputRef.current?.focusInput(),
            description: 'Focus sur la recherche',
            ignoreInputFocus: false
        },
        {
            key: 'Backspace',
            ctrl: true,
            action: () => {
                if (cart && cart.items.length > 0) setIsClearConfirmOpen(true);
            },
            description: 'Vider le panier actuel',
            ignoreInputFocus: true
        },
        {
            key: 'w',
            ctrl: true,
            action: () => {
                createCart();
                toast.success('Vente suspendue. Nouveau panier créé.');
            },
            description: 'Suspendre la vente et créer un nouveau panier',
            ignoreInputFocus: true
        }
    ];

    useKeyboardShortcuts(shortcuts, 'Vente');

    if (!isMounted) return null;

    return (
        <div className="h-full flex flex-col p-2 gap-2 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 flex-grow min-h-0">
                {/* Cart panel */}
                <div className="lg:col-span-3 flex flex-col glass rounded-2xl overflow-hidden min-h-0 shadow-[var(--glass-shadow)]">
                    <CartDisplay />
                    <div className="mt-auto p-3 space-y-3 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-sm">
                        <CartTotalBar />
                        <SaleActions 
                            customerComboRef={customerComboRef}
                            onOpenPayment={openPayment}
                        />
                    </div>
                </div>

                {/* Product search panel */}
                <div className="lg:col-span-2 flex flex-col min-h-0 glass rounded-2xl overflow-hidden">
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
                description="Tous les articles de la vente en cours seront supprimés définitivement."
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