'use client';

import React, { useState, useEffect, memo, useCallback } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Minus, Plus, ShoppingCart, Edit3, Check } from 'lucide-react';
import { roundQty, roundFinancial, cn } from "@/lib/utils";
import type { CartItem } from "@/lib/types";
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface CartItemRowProps {
    item: CartItem;
    isSelected: boolean;
    onUpdate: (uuid: string, quantity: number) => void;
    onPriceUpdate: (uuid: string, price: number) => void;
    onRemove: (uuid: string) => void;
    onSelect: () => void;
}

/**
 * iPOS Cart Row Component.
 * Features: Inline quantity controls and "Open Price" direct editing.
 */
const CartItemRow = memo(({ item, isSelected, onUpdate, onPriceUpdate, onRemove, onSelect }: CartItemRowProps) => {
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [tempPrice, setTempPrice] = useState(item.price.toString());
    
    const isZero = item.cartQuantity <= 0;
    const lineTotal = item.price * item.cartQuantity;

    const handlePriceSubmit = () => {
        const val = roundFinancial(parseFloat(tempPrice) || 0);
        if (val >= 0) {
            onPriceUpdate(item.uuid, val);
        }
        setIsEditingPrice(false);
    };

    return (
        <div 
            tabIndex={0}
            onFocus={onSelect}
            className={cn(
                "grid grid-cols-[1fr_auto_auto_40px] gap-x-2 items-center px-3 py-1 rounded-md transition-all duration-150 group outline-none h-11 border-b border-transparent",
                isSelected ? "bg-primary/5 shadow-inner" : "hover:bg-muted/30",
                isZero && "opacity-40"
            )}
        >
            {/* Designation & Dynamic Price Editing */}
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className={cn("font-bold text-[12px] tracking-tight truncate", isZero && "line-through")}>
                        {item.name}
                    </span>
                    {(item as any).isPriceOverridden && <Edit3 className="h-2.5 w-2.5 text-blue-500" />}
                </div>
                
                {isEditingPrice ? (
                    <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                        <input
                            autoFocus
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => { 
                                if(e.key === 'Enter') handlePriceSubmit();
                                if(e.key === 'Escape') setIsEditingPrice(false);
                            }}
                            onBlur={handlePriceSubmit}
                            className="w-16 h-4 bg-background border rounded px-1 text-[10px] font-black focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button onClick={handlePriceSubmit} className="text-emerald-500 hover:scale-125 transition-transform">
                            <Check className="h-2 w-2" />
                        </button>
                    </div>
                ) : (
                    <div 
                        className="flex items-center gap-1 cursor-pointer hover:bg-primary/5 rounded px-1 -ml-1 transition-colors group/price"
                        onClick={(e) => { e.stopPropagation(); setIsEditingPrice(true); setTempPrice(item.price.toString()); }}
                        title="Modifier le prix unitaire"
                    >
                        <span className="text-[10px] font-black text-primary tabular-nums group-hover/price:underline">{item.price}</span>
                        <span className="text-[8px] font-bold text-muted-foreground/30 uppercase">/ {item.unit || 'pcs'}</span>
                    </div>
                )}
            </div>
            
            {/* Quantity Controls - High Density */}
            <div className="flex items-center bg-background/50 rounded border h-7 overflow-hidden">
                <button 
                    onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, Math.max(0, roundQty(item.cartQuantity - 1))); }}
                    className="w-6 h-full flex items-center justify-center hover:bg-muted text-muted-foreground/50 hover:text-foreground"
                >
                    <Minus className="h-3 w-3" />
                </button>
                <input
                    type="number" 
                    value={item.cartQuantity}
                    onChange={(e) => onUpdate(item.uuid, parseFloat(e.target.value) || 0)}
                    className="w-10 text-center h-full bg-transparent border-none font-bold text-[11px] focus:outline-none tabular-nums"
                />
                <button 
                    onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, roundQty(item.cartQuantity + 1)); }}
                    className="w-6 h-full flex items-center justify-center hover:bg-muted text-muted-foreground/50 hover:text-foreground"
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>

            {/* Line Total */}
            <div className="w-20 text-right">
                <span className="font-black text-[13px] tracking-tighter tabular-nums text-foreground">
                    {Math.round(lineTotal)}
                </span>
            </div>

            {/* Remove Action */}
            <button 
                onClick={(e) => { e.stopPropagation(); onRemove(item.uuid); }}
                className="flex items-center justify-center h-8 w-8 text-muted-foreground/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Supprimer l'article"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
});
CartItemRow.displayName = 'CartItemRow';

export function CartDisplay() {
    const [isMounted, setIsMounted] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const cart = useActiveCart();
    const { updateItemQuantity, updateItemPrice, removeItemFromCart } = useCartActions();
    
    useEffect(() => { setIsMounted(true); }, []);

    const handleUpdateQty = useCallback((u: string, q: number) => updateItemQuantity(u, q), [updateItemQuantity]);
    const handleUpdatePrice = useCallback((u: string, p: number) => updateItemPrice(u, p), [updateItemPrice]);
    const handleRemove = useCallback((u: string) => removeItemFromCart(u), [removeItemFromCart]);

    useKeyboardShortcuts([
        { key: 'ArrowDown', action: () => { if (cart?.items.length) setSelectedIndex(prev => prev === null || prev >= cart.items.length - 1 ? 0 : prev + 1); }, description: 'Suivant', ignoreInputFocus: true },
        { key: 'ArrowUp', action: () => { if (cart?.items.length) setSelectedIndex(prev => prev === null || prev <= 0 ? cart.items.length - 1 : prev - 1); }, description: 'Précédent', ignoreInputFocus: true },
        { key: 'Delete', action: () => { if (selectedIndex !== null && cart?.items[selectedIndex]) handleRemove(cart.items[selectedIndex].uuid); }, description: 'Supprimer ligne', ignoreInputFocus: true }
    ], 'ListePanier', isMounted && !!cart?.items.length);

    if (!isMounted) return null;
    
    if (!cart || cart.items.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-8 opacity-10">
                <ShoppingCart className="h-12 w-12 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Caisse prête</p>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="py-2">
                {cart.items.map((item, index) => (
                    <CartItemRow 
                        key={item.uuid} 
                        item={item} 
                        isSelected={selectedIndex === index}
                        onUpdate={handleUpdateQty} 
                        onPriceUpdate={handleUpdatePrice}
                        onRemove={handleRemove} 
                        onSelect={() => setSelectedIndex(index)}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}
