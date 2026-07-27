'use client';

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, X, Coins, AlertTriangle, Calculator, Edit3, Minus, Plus, ShoppingCart } from 'lucide-react';
import { formatCurrency, roundQty, cn } from "@/lib/utils";
import type { CartItem } from "@/lib/types";
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CartItemRowProps {
    item: CartItem;
    isSelected: boolean;
    onUpdate: (uuid: string, quantity: number) => void;
    onPriceUpdate: (uuid: string, price: number) => void;
    onTotalUpdate: (uuid: string, total: number) => void;
    onRemove: (uuid: string) => void;
    onSelect: () => void;
}

const CartItemRow = memo(({ item, isSelected, onUpdate, onPriceUpdate, onTotalUpdate, onRemove, onSelect }: CartItemRowProps) => {
    const handleQtyChange = (val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        onUpdate(item.uuid, Math.max(0, num));
    };

    const handlePriceChange = (val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        onPriceUpdate(item.uuid, Math.max(0, num));
    };

    const handleTotalChange = (val: string) => {
        const newTotal = parseFloat(val);
        if (isNaN(newTotal)) return;
        onTotalUpdate(item.uuid, newTotal);
    };

    const isZero = item.cartQuantity <= 0;
    const isSellingAtLoss = item.price < item.purchasePrice && item.purchasePrice > 0;
    const lineTotal = item.price * item.cartQuantity;
    const isPriceOverridden = (item as any).isPriceOverridden;

    return (
        <div 
            tabIndex={0}
            onFocus={onSelect}
            className={cn(
                "grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center p-2 rounded-lg border transition-all duration-200 group outline-none h-16",
                isSelected ? "bg-primary/5 border-primary/40 shadow-sm" : "bg-card border-transparent hover:border-border/60",
                isZero && "opacity-50"
            )}
        >
            <div className="flex-grow min-w-0 pl-2">
                <div className="flex items-center gap-2">
                    <p className={cn("font-bold text-sm tracking-tight truncate", isZero && "line-through")}>
                        {item.name}
                    </p>
                    {isPriceOverridden && <Edit3 className="h-3 w-3 text-blue-500 opacity-50" />}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                    <div className="relative w-20">
                        <Input 
                            type="number" 
                            value={item.price}
                            onChange={(e) => handlePriceChange(e.target.value)}
                            className={cn("h-7 px-1 text-[11px] font-bold bg-muted/50 border-none", isSellingAtLoss && "text-destructive")}
                        />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">/ {item.unit || 'pcs'}</span>
                </div>
            </div>
            
            <div className="flex items-center bg-muted/40 rounded-md border overflow-hidden">
                <button 
                    onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, Math.max(0, roundQty(item.cartQuantity - 1))); }}
                    className="w-7 h-8 flex items-center justify-center hover:bg-muted text-muted-foreground"
                >
                    <Minus className="h-3 w-3" />
                </button>
                <Input
                    type="number" step="0.001"
                    value={item.cartQuantity}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="w-14 text-center h-8 bg-transparent border-none font-bold text-sm focus-visible:ring-0 tabular-nums"
                />
                <button 
                    onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, roundQty(item.cartQuantity + 1)); }}
                    className="w-7 h-8 flex items-center justify-center hover:bg-muted text-muted-foreground"
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>

            <div className="w-28 text-right">
                <Input
                    type="number"
                    value={Math.round(lineTotal)}
                    onChange={(e) => handleTotalChange(e.target.value)}
                    className="h-8 w-24 ml-auto text-right font-black text-sm bg-muted/30 border-none shadow-none"
                />
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onRemove(item.uuid); }}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
});
CartItemRow.displayName = 'CartItemRow';

export function CartDisplay() {
    const [isMounted, setIsMounted] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const cart = useActiveCart();
    const { updateItemQuantity, updateItemPrice, updateItemTotal, removeItemFromCart } = useCartActions();
    
    useEffect(() => { setIsMounted(true); }, []);

    const handleUpdateQty = useCallback((u: string, q: number) => updateItemQuantity(u, q), [updateItemQuantity]);
    const handleUpdatePrice = useCallback((u: string, p: number) => updateItemPrice(u, p), [updateItemPrice]);
    const handleUpdateTotal = useCallback((u: string, t: number) => updateItemTotal(u, t), [updateItemTotal]);
    const handleRemove = useCallback((u: string) => removeItemFromCart(u), [removeItemFromCart]);

    useKeyboardShortcuts([
        { key: 'ArrowDown', action: () => { if (cart?.items.length) setSelectedIndex(prev => prev === null || prev >= cart.items.length - 1 ? 0 : prev + 1); }, description: 'Suivant', ignoreInputFocus: true },
        { key: 'ArrowUp', action: () => { if (cart?.items.length) setSelectedIndex(prev => prev === null || prev <= 0 ? cart.items.length - 1 : prev - 1); }, description: 'Précédent', ignoreInputFocus: true }
    ], 'ListePanier', isMounted && !!cart?.items.length);

    if (!isMounted) return null;
    
    if (!cart || cart.items.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-8 opacity-20">
                <ShoppingCart className="h-16 w-16 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Selle en attente</p>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="p-3 space-y-1">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-3 mb-2 text-[9px] font-black uppercase text-muted-foreground/30 tracking-widest">
                    <div>Article</div>
                    <div className="w-28 text-center">Quantité</div>
                    <div className="w-28 text-right">Montant</div>
                    <div className="w-8"></div>
                </div>
                {cart.items.map((item, index) => (
                    <CartItemRow 
                        key={item.uuid} 
                        item={item} 
                        isSelected={selectedIndex === index}
                        onUpdate={handleUpdateQty} 
                        onPriceUpdate={handleUpdatePrice}
                        onTotalUpdate={handleUpdateTotal}
                        onRemove={handleRemove} 
                        onSelect={() => setSelectedIndex(index)}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}
