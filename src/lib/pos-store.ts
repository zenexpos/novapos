import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  description: string;
  imageUrl: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  discount: number;
  paymentMethod: 'cash' | 'card';
  timestamp: string;
}

interface POSState {
  products: Product[];
  cart: CartItem[];
  transactions: Transaction[];
  currentUser: string | null;
  
  // Actions
  login: (username: string) => void;
  logout: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  processTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set) => ({
      products: [
        { id: '1', name: 'Premium Espresso', price: 4.50, category: 'Beverages', stock: 100, description: 'Rich and smooth double shot espresso.', imageUrl: 'https://picsum.photos/seed/12/400/400' },
        { id: '2', name: 'Wireless Headphones', price: 129.99, category: 'Electronics', stock: 25, description: 'Noise cancelling over-ear headphones.', imageUrl: 'https://picsum.photos/seed/45/400/400' },
        { id: '3', name: 'Smartwatch v5', price: 199.00, category: 'Electronics', stock: 15, description: 'Track your health and stay connected.', imageUrl: 'https://picsum.photos/seed/78/400/400' },
      ],
      cart: [],
      transactions: [],
      currentUser: null,

      login: (username) => set({ currentUser: username }),
      logout: () => set({ currentUser: null, cart: [] }),
      
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (updated) => set((state) => ({
        products: state.products.map(p => p.id === updated.id ? updated : p)
      })),
      removeProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),

      addToCart: (product) => set((state) => {
        const existing = state.cart.find(item => item.id === product.id);
        if (existing) {
          return {
            cart: state.cart.map(item => 
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            )
          };
        }
        return { cart: [...state.cart, { ...product, quantity: 1 }] };
      }),

      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter(item => item.id !== id)
      })),

      updateCartQuantity: (id, quantity) => set((state) => ({
        cart: state.cart.map(item => 
          item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
        ).filter(item => item.quantity > 0)
      })),

      clearCart: () => set({ cart: [] }),

      processTransaction: (tData) => set((state) => {
        const newTransaction: Transaction = {
          ...tData,
          id: `TX-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
        
        // Update stock
        const updatedProducts = state.products.map(p => {
          const cartItem = tData.items.find(i => i.id === p.id);
          if (cartItem) {
            return { ...p, stock: p.stock - cartItem.quantity };
          }
          return p;
        });

        return {
          transactions: [newTransaction, ...state.transactions],
          products: updatedProducts,
          cart: [],
        };
      }),
    }),
    {
      name: 'novapos-storage',
    }
  )
);
