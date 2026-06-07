'use client';
import { create } from 'zustand';
import { produce } from 'immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Cart, CartItem, Product, Sale } from '@/lib/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import { companyProfileService } from '@/services/profile.service';
import { useAppStore } from './appStore';
import { FINANCIAL_EPSILON, safeNumber } from '@/lib/utils';

interface CartState {
    carts:        Cart[];
    activeCartId: string | null;
    actions:      CartActions;
}

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

    setCustomer:  (customerUuid: string | null) => void;
    setDiscount:  (type: 'fixed' | 'percentage', value: number) => void;

    clearCart:    () => void;
    resetCart:    () => void;

    processSale:  (amountPaid: number, dueDate?: Date) => Promise<Sale | null>;
}

const defaultCart: Omit<Cart, 'id' | 'name'> = {
    items:        [],
    customerUuid: null,
    discount:     { type: 'fixed', value: 0 },
};

const INITIAL_CART_ID = 'initial-cart-id';
const createInitialCart = (): Cart => ({
    id:   INITIAL_CART_ID,
    name: 'Vente 1',
    ...defaultCart,
});

const initialState: Omit<CartState, 'actions'> = {
    carts:        [createInitialCart()],
    activeCartId: INITIAL_CART_ID,
};

async function triggerAutoPrint(sale: Sale): Promise<void> {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('ipos-autoprint-enabled') !== 'true') return;

    try {
        const profile     = await companyProfileService.getProfile();
        const companyName = profile?.companyName || 'iPOS Zen';
        const addr        = profile?.address || '';
        const phone       = profile?.phone   || '';

        const rows = sale.items
            .map(i => {
                const lineTotal = (Number(i.price) * Number(i.quantity)).toFixed(2);
                return `<tr>
                    <td>${String(i.name)}</td>
                    <td style="text-align:center">${i.quantity}</td>
                    <td style="text-align:right">${Number(i.price).toFixed(2)}</td>
                    <td style="text-align:right">${lineTotal}</td>
                </tr>`;
            })
            .join('');

        const change    = Math.max(0, Number(sale.amountPaid) - Number(sale.total));
        const remaining = Math.max(0, Number(sale.remainingBalance));

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @page { margin:0; size:80mm auto; }
  body {
    width:80mm; margin:0 auto;
    font-family:'Courier New',Courier,monospace;
    font-size:9pt; color:#000; background:#fff;
    padding:4mm 3mm;
  }
  .c { text-align:center; }
  .r { text-align:right; }
  .b { font-weight:bold; }
  .lg { font-size:11pt; }
  .xs { font-size:7.5pt; }
  .sep  { border-top:1px dashed #000; margin:3mm 0; }
  .sep2 { border-top:2px solid  #000; margin:3mm 0; }
  table { width:100%; border-collapse:collapse; font-size:8pt; }
  th,td { padding:1px 2px; }
  th { border-bottom:1px solid #000; }
</style>
</head>
<body>
  <div class="c b lg">${companyName.toUpperCase()}</div>
  ${addr  ? `<div class="c xs">${addr}</div>`        : ''}
  ${phone ? `<div class="c xs">Tél: ${phone}</div>` : ''}
  <div class="sep2"></div>
  <div><b>FACTURE N°:</b> ${sale.invoiceNumber}</div>
  <div><b>DATE:</b> ${new Date(sale.createdAt!).toLocaleString('fr-DZ')}</div>
  <div class="sep"></div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left">ARTICLE</th>
        <th>QTÉ</th>
        <th class="r">P.U</th>
        <th class="r">TOTAL</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="sep2"></div>
  <div class="r">SOUS-TOTAL: <b>${Number(sale.subtotal).toFixed(2)} DA</b></div>
  ${sale.discountAmount && sale.discountAmount > 0
      ? `<div class="r">REMISE: -${Number(sale.discountAmount).toFixed(2)} DA</div>`
      : ''}
  <div class="r b lg">TOTAL NET: ${Number(sale.total).toFixed(2)} DA</div>
  <div class="sep"></div>
  <div class="r">REÇU: ${Number(sale.amountPaid).toFixed(2)} DA</div>
  ${change > 0.01
      ? `<div class="r b">MONNAIE RENDUE: ${change.toFixed(2)} DA</div>`
      : remaining > 0.01
      ? `<div class="r b">SOLDE DÛ: ${remaining.toFixed(2)} DA</div>`
      : ''}
  <div class="sep2"></div>
  <div class="c b">Merci de votre visite !</div>
  <div class="c xs" style="margin-top:4mm;opacity:.4">${sale.invoiceNumber}</div>
</body>
</html>`;

        if (typeof window === 'undefined') return;
        const win = window.open('', '_blank', 'width=420,height=640,toolbar=no');
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
            win.close();
        }, 350);
    } catch (_e) {
        // Silent error
    }
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            ...initialState,
            actions: {
                getActiveCart: () => {
                    const { carts, activeCartId } = get();
                    return (
                        carts.find((c: Cart) => c.id === activeCartId) ||
                        carts[0] ||
                        null
                    );
                },

                createCart: (name) => {
                    const newId = uuidv4();
                    set(
                        produce((state: CartState) => {
                            state.carts.push({
                                id:   newId,
                                name: name || `Vente ${state.carts.length + 1}`,
                                ...defaultCart,
                            });
                            state.activeCartId = newId;
                        }),
                    );
                    return newId;
                },

                deleteCart: (cartId) => {
                    set(
                        produce((state: CartState) => {
                            if (state.carts.length <= 1) {
                                const cart = state.carts[0];
                                if (cart)
                                    Object.assign(cart, {
                                        ...defaultCart,
                                        name: 'Vente 1',
                                    });
                                return;
                            }
                            state.carts = state.carts.filter(
                                c => c.id !== cartId,
                            );
                            if (state.activeCartId === cartId) {
                                state.activeCartId =
                                    state.carts[0]?.id || null;
                            }
                        }),
                    );
                },

                selectCart: (cartId) => {
                    if (get().carts.find(c => c.id === cartId)) {
                        set({ activeCartId: cartId });
                    }
                },

                renameCart: (cartId, newName) => {
                    set(
                        produce((state: CartState) => {
                            const cart = state.carts.find(
                                c => c.id === cartId,
                            );
                            if (cart) cart.name = newName;
                        }),
                    );
                },

                addItemToCart: (product, quantity = 1) => {
                    const { activeCartId, carts } = get();
                    const currentCart = carts.find(c => c.id === activeCartId);
                    if (!currentCart) return;

                    const existingItem = currentCart.items.find(
                        item => item.uuid === product.uuid,
                    );
                    const isStockedItem =
                        !product.uuid.startsWith('custom-') &&
                        product.uuid !== 'BREAD_PRODUCT';

                    const finalQtyToAdd = Number(safeNumber(quantity).toFixed(3));

                    if (isStockedItem) {
                        const currentCartQty = existingItem ? existingItem.cartQuantity : 0;
                        const requestedTotal = currentCartQty + finalQtyToAdd;

                        if (product.quantity < requestedTotal - FINANCIAL_EPSILON) {
                            toast.error(`Stock insuffisant pour "${product.name}"`, {
                                description: `Disponible: ${product.quantity}, Demandé: ${requestedTotal}.`,
                            });
                            return;
                        }
                    }

                    set(
                        produce((state: CartState) => {
                            const targetCart = state.carts.find(c => c.id === state.activeCartId);
                            if (!targetCart) return;

                            const item = targetCart.items.find(i => i.uuid === product.uuid);
                            if (item) {
                                item.cartQuantity = Number((item.cartQuantity + finalQtyToAdd).toFixed(3));
                                item.flash = true;
                            } else {
                                targetCart.items.unshift({
                                    ...product,
                                    cartQuantity: finalQtyToAdd,
                                    flash: true,
                                } as CartItem);
                            }
                        }),
                    );

                    setTimeout(() => {
                        set(
                            produce((state: CartState) => {
                                const targetCart = state.carts.find(c => c.id === state.activeCartId);
                                const item = targetCart?.items.find(i => i.uuid === product.uuid);
                                if (item) item.flash = false;
                            }),
                        );
                    }, 500);
                },

                removeItemFromCart: (productUuid) => {
                    set(
                        produce((state: CartState) => {
                            const cart = state.carts.find(c => c.id === state.activeCartId);
                            if (cart) cart.items = cart.items.filter(item => item.uuid !== productUuid);
                        }),
                    );
                },

                updateItemQuantity: (productUuid, newQuantity) => {
                    set(
                        produce((state: CartState) => {
                            const cart = state.carts.find(c => c.id === state.activeCartId);
                            const item = cart?.items.find(i => i.uuid === productUuid);
                            if (!item) return;

                            const isStockedItem = !item.uuid.startsWith('custom-') && item.uuid !== 'BREAD_PRODUCT';
                            const finalNewQty = Number(safeNumber(newQuantity).toFixed(3));

                            if (isStockedItem && finalNewQty > item.quantity + FINANCIAL_EPSILON) {
                                toast.error('Stock insuffisant', { description: `Max: ${item.quantity}` });
                                item.cartQuantity = item.quantity;
                                return;
                            }

                            item.cartQuantity = Math.max(0, finalNewQty);
                        }),
                    );
                },

                updateItemPrice: (productUuid, newPrice) => {
                    set(
                        produce((state: CartState) => {
                            const cart = state.carts.find(c => c.id === state.activeCartId);
                            const item = cart?.items.find(i => i.uuid === productUuid);
                            if (item) {
                                item.price = Number(Math.max(0, safeNumber(newPrice)).toFixed(2));
                            }
                        }),
                    );
                },

                setCustomer: (customerUuid) => {
                    set(
                        produce((state: CartState) => {
                            const cart = state.carts.find(c => c.id === state.activeCartId);
                            if (cart) cart.customerUuid = customerUuid;
                        }),
                    );
                },

                setDiscount: (type, value) => {
                    set(
                        produce((state: CartState) => {
                            const cart = state.carts.find(c => c.id === state.activeCartId);
                            if (cart) cart.discount = { type, value: Math.max(0, value) };
                        }),
                    );
                },

                clearCart: () => {
                    set(
                        produce((state: CartState) => {
                            const cart = state.carts.find(c => c.id === state.activeCartId);
                            if (cart) cart.items = [];
                        }),
                    );
                },

                resetCart: () => {
                    set(
                        produce((state: CartState) => {
                            const cart = state.carts.find(c => c.id === state.activeCartId);
                            if (cart) {
                                const { id, name } = cart;
                                Object.assign(cart, { ...defaultCart, id, name });
                            }
                        }),
                    );
                },

                processSale: async (amountPaid, dueDate) => {
                    const activeCart = get().actions.getActiveCart();
                    if (!activeCart) return null;

                    const activeItems = activeCart.items.filter(i => i.cartQuantity > 0);
                    if (activeItems.length === 0) {
                        toast.error('Aucun article actif dans le panier.');
                        return null;
                    }

                    try {
                        const sale = await salesService.createSale({
                            items:         activeItems,
                            discountType:  activeCart.discount.type,
                            discountValue: activeCart.discount.value,
                            amountPaid:    safeNumber(amountPaid),
                            customerUuid:  activeCart.customerUuid,
                            dueDate,
                        });

                        get().actions.resetCart();

                        if (activeCart.customerUuid) {
                            await customerService.recalculateCustomerStatus(activeCart.customerUuid);
                        }

                        useAppStore.getState().actions.triggerSmartSync();
                        triggerAutoPrint(sale);

                        return sale;
                    } catch (error: any) {
                        toast.error('Échec de la transaction.', { description: error.message });
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
    const carts        = useCartStore(state => state.carts);
    const activeCartId = useCartStore(state => state.activeCartId);
    return carts.find(c => c.id === activeCartId) || carts[0] || null;
};
