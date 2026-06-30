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
 * UI AUDIT FIX:
 * - Minimum font size 12px for desktop POS.
 * - Standardized row height (h-24).
 * - Clearer price override indicators.
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
                    "grid grid-cols-[1fr_auto_auto_auto] gap-x-10 items-center p-6 rounded-[1.5rem] border-2 transition-all duration-300 group outline-none h-28",
                    isSelected ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20 shadow-xl" : "bg-muted/10 border-border/60 hover:bg-muted/20",
                    isZero && "opacity-50 grayscale"
                )}
            >
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <p className={cn(
                            "font-black text-[17px] tracking-tighter truncate group-hover:text-primary transition-colors",
                            isZero && "text-muted-foreground line-through"
                        )}>
                            {item.name}
                        </p>
                        {isCustom && (
                            <div className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-700 text-[10px] font-black uppercase border border-amber-500/20">Service</div>
                        )}
                        {isPriceOverridden && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Edit3 className="h-4 w-4 text-blue-600 animate-pulse cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Prix manuel appliqué</TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2">
                        <div className="relative group/price">
                            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within/price:text-primary transition-colors" />
                            <Input 
                                type="number" min="0" step="1"
                                value={item.price}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                onFocus={e => e.target.select()}
                                className={cn(
                                    "h-9 w-32 pl-9 pr-3 text-sm font-black bg-background border-border/80 shadow-inner focus-visible:ring-primary/40 rounded-xl tabular-nums",
                                    isSellingAtLoss ? "text-destructive border-destructive/50" : isPriceOverridden ? "text-blue-700 border-blue-300" : ""
                                )}
                            />
                        </div>
                        <span className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-widest">/ {item.unit || 'pcs'}</span>
                        
                        {isSellingAtLoss && (
                            <div className="p-1.5 rounded-xl bg-destructive/10 flex items-center gap-2 px-4 border border-destructive/20 animate-pulse">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <span className="text-[11px] font-black text-destructive uppercase">Perte</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-col items-center">
                    <div className="flex items-center bg-background rounded-2xl border-2 border-border shadow-inner overflow-hidden">
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, Math.max(0, roundQty(item.cartQuantity - 1))); }}
                            className="px-5 h-12 hover:bg-muted text-muted-foreground hover:text-primary transition-all font-black border-r-2 border-border"
                        >
                            <Minus className="h-5 w-5" />
                        </button>
                        
                        <Input
                            ref={qtyInputRef}
                            type="number" min="0" step="0.001"
                            value={item.cartQuantity}
                            onChange={(e) => handleQtyChange(e.target.value)}
                            onFocus={e => e.target.select()}
                            className={cn(
                                "w-24 text-center h-12 bg-transparent border-none shadow-none font-black text-2xl focus-visible:ring-0 tabular-nums",
                                isZero ? "text-destructive" : "text-primary"
                            )}
                        />

                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, roundQty(item.cartQuantity + 1)); }}
                            className="px-5 h-12 hover:bg-muted text-muted-foreground hover:text-primary transition-all font-black border-l-2 border-border"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="w-40 flex flex-col items-end">
                    <div className="relative group/total">
                        <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within/total:text-primary transition-colors" />
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={isZero ? '0' : Math.round(lineTotal)}
                            onChange={(e) => handleTotalChange(e.target.value)}
                            onFocus={e => e.target.select()}
                            className={cn(
                                "h-12 w-36 pl-10 text-right font-black text-xl tracking-tighter tabular-nums bg-background border-2 border-border shadow-md focus-visible:ring-primary/40 rounded-2xl",
                                isZero && "text-muted-foreground/20 line-through"
                            )}
                        />
                    </div>
                    <p className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-2 mr-1">Audit Net</p>
                </div>

                <Button 
                    variant="ghost" 
                    size="icon" 
                    aria-label={`Supprimer ${item.name}`}
                    className={cn(
                        "h-12 w-12 rounded-2xl transition-all duration-300",
                        isZero 
                            ? "text-destructive opacity-100 bg-destructive/10" 
                            : "text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => { e.stopPropagation(); onRemove(item.uuid); }}
                >
                    {isZero ? <X className="h-6 w-6" /> : <Trash2 className="h-6 w-6" />}
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
            <div className="flex-grow flex flex-col items-center justify-center text-center p-12 space-y-12 animate-in fade-in duration-1000">
                <div className="p-16 rounded-[4.5rem] bg-muted/10 border-2 border-dashed border-border/60 shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-10 transition-opacity duration-1000" />
                    <ShoppingCart className="h-36 w-36 text-muted-foreground/10 relative z-10 group-hover:scale-110 transition-transform duration-1000" />
                </div>
                <div className="space-y-5 max-w-sm">
                    <p className="text-4xl font-black tracking-tighter text-muted-foreground/40 uppercase">Console Prête</p>
                    <p className="text-[12px] font-black uppercase text-muted-foreground/20 tracking-[0.5em] leading-relaxed">
                        En attente du prochain encaissement Elite.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="p-8 pb-24">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-10 items-center text-[11px] font-black uppercase text-muted-foreground/50 px-10 mb-10 tracking-[0.3em]">
                    <div className="text-left">Désignation Marchandise</div>
                    <div className="text-center">Volume Flux</div>
                    <div className="text-right">Audit Net (DA)</div>
                    <div className="w-12"></div>
                </div>

                <div className="space-y-5">
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