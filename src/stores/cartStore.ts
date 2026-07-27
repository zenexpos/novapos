'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Cart, CartItem, Product, Sale } from '@/lib/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { salesService } from '@/services/sales.service';
import { useAppStore } from './appStore';
import { FINANCIAL_EPSILON, safeNumber, roundFinancial, roundQty } from '@/lib/utils';

/**
 * iPOS Zen - Cart Store (Enterprise Grade)
 * Unified cart management with Joint Invoicing support for multiple customers.
 */
interface CartActions {
    getActiveCart:       () => Cart | null;
    createCart:          (name?: string) => string;
    deleteCart:          (cartId: string) => void;
    selectCart:          (cartId: string) => void;
    renameCart:          (cartId: string, newName: string) => void;

    addItemToCart:       (product: Product, quantity?: number) => void;
    removeItemFromCart:  (productUuid: string) => void;
    updateItemQuantity:  (productUuid: string, newQuantity: number) => void;
    updateItemPrice:     (productUuid: string, newPrice: number) => void;
    updateItemTotal:     (productUuid: string, total: number) => void;

    toggleCustomer:      (customerUuid: string) => void;
    clearCustomers:      () => void;
    setDiscount:         (type: 'fixed' | 'percentage', value: number) => void;

    clearCart:    () => void;
    processSale:  (amountPaid: number, dueDate?: Date) => Promise<Sale | null>;
}

interface CartState {
    carts:        Cart[];
    activeCartId: string | null;
    actions:      CartActions;
}

const defaultCart: Omit<Cart, 'id' | 'name'> = {
    items:         [],
    customerUuids: [], 
    discount:      { type: 'fixed', value: 0 },
};

const INITIAL_CART_ID = 'initial-cart-id';

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            carts: [{ id: INITIAL_CART_ID, name: 'Vente 1', ...defaultCart }],
            activeCartId: INITIAL_CART_ID,
            actions: {
                getActiveCart: () => {
                    const { carts, activeCartId } = get();
                    return carts.find(c => c.id === activeCartId) || carts[0] || null;
                },

                createCart: (name) => {
                    const newId = uuidv4();
                    set(produce((state: CartState) => {
                        state.carts.push({
                            id:   newId,
                            name: name || `Vente ${state.carts.length + 1}`,
                            ...defaultCart,
                        });
                        state.activeCartId = newId;
                    }));
                    return newId;
                },

                deleteCart: (cartId) => {
                    set(produce((state: CartState) => {
                        if (state.carts.length <= 1) {
                            const cart = state.carts[0];
                            if (cart) {
                                cart.items = [];
                                cart.customerUuids = [];
                                cart.discount = { type: 'fixed', value: 0 };
                            }
                            return;
                        }
                        state.carts = state.carts.filter(c => c.id !== cartId);
                        if (state.activeCartId === cartId) {
                            state.activeCartId = state.carts[0]?.id || null;
                        }
                    }));
                },

                selectCart: (cartId) => {
                    if (get().carts.find(c => c.id === cartId)) {
                        set({ activeCartId: cartId });
                    }
                },

                renameCart: (cartId, newName) => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === cartId);
                        if (cart) cart.name = newName;
                    }));
                },

                addItemToCart: (product, quantity = 1) => {
                    const activeId = get().activeCartId;
                    if (!activeId) return;

                    const qtyToAdd = roundQty(safeNumber(quantity));
                    if (qtyToAdd <= 0) return;

                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === activeId);
                        if (!cart) return;

                        const item = cart.items.find(i => i.uuid === product.uuid);
                        const isStocked = !product.uuid.startsWith('custom-') && product.uuid !== 'BREAD_PRODUCT';

                        const currentInCart = item ? item.cartQuantity : 0;
                        const totalRequested = roundQty(currentInCart + qtyToAdd);

                        if (isStocked && product.quantity < totalRequested - FINANCIAL_EPSILON) {
                            toast.error(`Stock insuffisant pour "${product.name}"`, {
                                description: `Disponible: ${product.quantity}, Demandé: ${totalRequested}.`
                            });
                            return;
                        }

                        if (item) {
                            item.cartQuantity = totalRequested;
                        } else {
                            cart.items.unshift({
                                ...product,
                                cartQuantity: qtyToAdd,
                            } as CartItem);
                        }
                    }));
                },

                removeItemFromCart: (productUuid) => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) cart.items = cart.items.filter(item => item.uuid !== productUuid);
                    }));
                },

                updateItemQuantity: (productUuid, newQuantity) => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        const item = cart?.items.find(i => i.uuid === productUuid);
                        if (!item) return;

                        const isStocked = !item.uuid.startsWith('custom-') && item.uuid !== 'BREAD_PRODUCT';
                        const finalQty = roundQty(safeNumber(newQuantity));

                        if (isStocked && finalQty > item.quantity + FINANCIAL_EPSILON) {
                            toast.error('Limite de stock atteinte');
                            item.cartQuantity = roundQty(item.quantity);
                            return;
                        }

                        item.cartQuantity = Math.max(0, finalQty);
                    }));
                },

                updateItemPrice: (productUuid, newPrice) => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        const item = cart?.items.find(i => i.uuid === productUuid);
                        if (item) {
                            item.price = roundFinancial(safeNumber(newPrice));
                            (item as any).isPriceOverridden = true;
                        }
                    }));
                },

                updateItemTotal: (productUuid, total) => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        const item = cart?.items.find(i => i.uuid === productUuid);
                        if (!item || item.price <= 0) return;
                        
                        const calculatedQty = roundQty(safeNumber(total) / item.price);
                        const isStocked = !item.uuid.startsWith('custom-') && item.uuid !== 'BREAD_PRODUCT';
                        
                        if (isStocked && calculatedQty > item.quantity + FINANCIAL_EPSILON) {
                            toast.error('Stock insuffisant pour ce montant');
                            return;
                        }
                        
                        item.cartQuantity = calculatedQty;
                    }));
                },

                toggleCustomer: (customerUuid) => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) {
                            if (!cart.customerUuids) cart.customerUuids = [];
                            const index = cart.customerUuids.indexOf(customerUuid);
                            if (index >= 0) cart.customerUuids.splice(index, 1);
                            else cart.customerUuids.push(customerUuid);
                        }
                    }));
                },

                clearCustomers: () => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) cart.customerUuids = [];
                    }));
                },

                setDiscount: (type, value) => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) cart.discount = { type, value: Math.max(0, value) };
                    }));
                },

                clearCart: () => {
                    set(produce((state: CartState) => {
                        const cart = state.carts.find(c => c.id === state.activeCartId);
                        if (cart) {
                            cart.items = [];
                            cart.customerUuids = [];
                            cart.discount = { type: 'fixed', value: 0 };
                        }
                    }));
                },

                processSale: async (amountPaid, dueDate) => {
                    const activeCart = get().actions.getActiveCart();
                    if (!activeCart) return null;

                    const activeItems = activeCart.items.filter(i => i.cartQuantity > 0);
                    if (activeItems.length === 0) return null;

                    const customerUuids = activeCart.customerUuids || [];
                    
                    try {
                        // FIXED: Single createSale call for multiple customers to prevent double-stock deduction
                        const lastSale = await salesService.createSale({
                            items:         activeItems,
                            discountType:  activeCart.discount.type,
                            discountValue: activeCart.discount.value,
                            amountPaid:    roundFinancial(safeNumber(amountPaid)),
                            customerUuids: customerUuids,
                            dueDate,
                        });

                        get().actions.clearCart();
                        useAppStore.getState().actions.triggerSmartSync();
                        
                        return lastSale;
                    } catch (error: any) {
                        toast.error('Transaction impossible', { description: error.message });
                        return null;
                    }
                },
            },
        }),
        {
            name:    'ipos-cart-store',
            storage: createJSONStorage(() => localStorage),
            partialize: state => ({
                carts:        state.carts,
                activeCartId: state.activeCartId,
            }),
        },
    ),
);

export const useCartActions = () => useCartStore(state => state.actions);
export const useActiveCart = () => {
    const carts = useCartStore(state => state.carts);
    const activeId = useCartStore(state => state.activeCartId);
    return carts.find(c => c.id === activeId) || carts[0] || null;
};
