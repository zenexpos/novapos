'use client';

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, X, Coins, AlertTriangle, Calculator, Edit3, Minus, Plus } from 'lucide-react';
import { formatCurrency, roundQty, cn } from "@/lib/utils";
import type { CartItem } from "@/lib/types";
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CartItemRowProps {
    item: CartItem;
    isSelected: boolean;
    onUpdate: (uuid: string, quantity: number) => void;
    onPriceUpdate: (uuid: string, price: number) => void;
    onTotalUpdate: (uuid: string, total: number) => void;
    onRemove: (uuid: string) => void;
    onSelect: () => void;
}

/**
 * PERFORMANCE OPTIMIZATION: React.memo
 */
const CartItemRow = memo(({ item, isSelected, onUpdate, onPriceUpdate, onTotalUpdate, onRemove, onSelect }: CartItemRowProps) => {
    const qtyInputRef = useRef<HTMLInputElement>(null);

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

    const isCustom = item.uuid.startsWith('custom-');
    const isZero = item.cartQuantity <= 0;
    const isSellingAtLoss = item.price < item.purchasePrice && item.purchasePrice > 0;
    const lineTotal = item.price * item.cartQuantity;
    const isPriceOverridden = (item as any).isPriceOverridden;

    return (
        <TooltipProvider delayDuration={400}>
            <div 
                tabIndex={0}
                onFocus={onSelect}
                className={cn(
                    "grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center p-4 rounded-2xl border transition-all duration-300 group outline-none",
                    isSelected ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20 shadow-sm" : "bg-muted/20 border-border hover:bg-muted/30",
                    isZero && "opacity-50 grayscale"
                )}
            >
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className={cn(
                            "font-black text-sm tracking-tight truncate group-hover:text-primary transition-colors",
                            isZero && "text-muted-foreground line-through"
                        )}>
                            {item.name}
                        </p>
                        {isCustom && (
                            <div className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase border border-amber-500/20">Manuel</div>
                        )}
                        {isPriceOverridden && (
                            <Edit3 className="h-3 w-3 text-blue-500" />
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                        <div className="relative group/price">
                            <Coins className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground/30 group-focus-within/price:text-primary transition-colors" />
                            <Input 
                                type="number" min="0" step="1"
                                value={item.price}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                onFocus={e => e.target.select()}
                                className={cn(
                                    "h-7 w-24 pl-6 pr-1 text-[10px] font-black bg-background border-border shadow-sm focus-visible:ring-primary/20 rounded-lg tabular-nums",
                                    isSellingAtLoss ? "text-destructive border-destructive/30" : isPriceOverridden ? "text-blue-600 border-blue-200" : ""
                                )}
                            />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">/ {item.unit || 'pcs'}</span>
                        
                        {isSellingAtLoss && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="p-1 rounded-lg bg-destructive/10 animate-pulse cursor-help flex items-center gap-1 px-2 border border-destructive/20">
                                        <AlertTriangle className="h-3 w-3 text-destructive" />
                                        <span className="text-[8px] font-black text-destructive uppercase">Perte</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-destructive text-white border-none rounded-xl p-4 shadow-2xl max-w-[250px]">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-center border-b border-white/20 pb-2 mb-2">Alerte : Vente à perte</p>
                                        <p className="text-[9px] font-medium leading-relaxed">Le prix est inférieur à votre coût d'achat moyen (PMP).</p>
                                        <p className="text-[10px] font-black text-center mt-2">PMP: {formatCurrency(item.purchasePrice)}</p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-col items-center">
                    <div className="flex items-center bg-background rounded-xl border border-border overflow-hidden shadow-inner">
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, Math.max(0, roundQty(item.cartQuantity - 1))); }}
                            className="px-3 h-10 hover:bg-muted text-muted-foreground hover:text-primary transition-colors font-black"
                        >
                            <Minus className="h-3.5 w-3.5" />
                        </button>
                        
                        <Input
                            ref={qtyInputRef}
                            type="number" min="0" step="0.001"
                            value={item.cartQuantity}
                            onChange={(e) => handleQtyChange(e.target.value)}
                            onFocus={e => e.target.select()}
                            className={cn(
                                "w-16 text-center h-10 bg-transparent border-none shadow-none font-black text-lg focus-visible:ring-0 tabular-nums",
                                isZero ? "text-destructive" : "text-primary"
                            )}
                        />

                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, roundQty(item.cartQuantity + 1)); }}
                            className="px-3 h-10 hover:bg-muted text-muted-foreground hover:text-primary transition-colors font-black"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                <div className="w-32 flex flex-col items-end">
                    <div className="relative group/total">
                        <Calculator className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground/30 group-focus-within/total:text-primary transition-colors" />
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={isZero ? '0' : Math.round(lineTotal)}
                            onChange={(e) => handleTotalChange(e.target.value)}
                            onFocus={e => e.target.select()}
                            className={cn(
                                "h-10 w-28 pl-7 text-right font-black text-base tracking-tighter tabular-nums bg-background border-border shadow-sm focus-visible:ring-primary/20 rounded-xl",
                                isZero && "text-muted-foreground/20 line-through"
                            )}
                        />
                    </div>
                    <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1 mr-1">Sous-total net</p>
                </div>

                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "h-10 w-10 rounded-xl transition-all",
                        isZero 
                            ? "text-destructive opacity-100 bg-destructive/5 hover:bg-destructive/10" 
                            : "text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => { e.stopPropagation(); onRemove(item.uuid); }}
                >
                    {isZero ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </div>
        </TooltipProvider>
    );
}, (prev, next) => {
    return (
        prev.item.cartQuantity === next.item.cartQuantity &&
        prev.item.price === next.item.price &&
        prev.isSelected === next.isSelected &&
        prev.item.uuid === next.item.uuid
    );
});
CartItemRow.displayName = 'CartItemRow';

export function CartDisplay() {
    const [isMounted, setIsMounted] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const cart = useActiveCart();
    const { updateItemQuantity, updateItemPrice, updateItemTotal, removeItemFromCart } = useCartActions();
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleUpdateQty = useCallback((u: string, q: number) => updateItemQuantity(u, q), [updateItemQuantity]);
    const handleUpdatePrice = useCallback((u: string, p: number) => updateItemPrice(u, p), [updateItemPrice]);
    const handleUpdateTotal = useCallback((u: string, t: number) => updateItemTotal(u, t), [updateItemTotal]);
    const handleRemove = useCallback((u: string) => removeItemFromCart(u), [removeItemFromCart]);

    useKeyboardShortcuts([
        {
            key: 'ArrowDown',
            action: () => {
                if (cart && cart.items.length > 0) {
                    setSelectedIndex(prev => prev === null || prev >= cart.items.length - 1 ? 0 : prev + 1);
                }
            },
            description: 'Ligne suivante',
            ignoreInputFocus: true
        },
        {
            key: 'ArrowUp',
            action: () => {
                if (cart && cart.items.length > 0) {
                    setSelectedIndex(prev => prev === null || prev <= 0 ? cart.items.length - 1 : prev - 1);
                }
            },
            description: 'Ligne précédente',
            ignoreInputFocus: true
        }
    ], 'ListePanier', isMounted && !!cart?.items.length);

    if (!isMounted) return null;
    
    if (!cart || cart.items.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-10 space-y-8 animate-in fade-in duration-1000">
                <div className="p-10 rounded-[3rem] bg-muted/20 border-2 border-dashed border-border shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-10 transition-opacity" />
                    <Calculator className="h-24 w-24 text-muted-foreground/10 relative z-10 group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="space-y-4">
                    <p className="text-2xl font-black tracking-tighter text-muted-foreground/30 uppercase">Console de Vente Prête</p>
                    <p className="text-[10px] font-black uppercase text-muted-foreground/15 tracking-[0.5em] leading-relaxed max-w-[300px] mx-auto">
                        Scannez un article [F3] ou saisissez une référence manuelle [F4].
                    </p>
                </div>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="p-6">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center text-[9px] font-black uppercase text-muted-foreground/40 px-6 mb-6 tracking-widest">
                    <div className="text-left">Description Marchandise</div>
                    <div className="text-center">Volume Flux</div>
                    <div className="text-right">Audit Net (DA)</div>
                    <div></div>
                </div>

                <div className="space-y-3">
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
            </div>
        </ScrollArea>
    );
}
