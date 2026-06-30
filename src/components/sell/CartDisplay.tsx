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
 * UI/UX AUDIT: Item row height standardized, typography legible, targets clickable.
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
                    "grid grid-cols-[1fr_auto_auto_auto] gap-x-8 items-center p-5 rounded-[1.25rem] border transition-all duration-300 group outline-none",
                    isSelected ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20 shadow-md" : "bg-muted/10 border-border/50 hover:bg-muted/20",
                    isZero && "opacity-50 grayscale"
                )}
            >
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <p className={cn(
                            "font-black text-[15px] tracking-tight truncate group-hover:text-primary transition-colors",
                            isZero && "text-muted-foreground line-through"
                        )}>
                            {item.name}
                        </p>
                        {isCustom && (
                            <div className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase border border-amber-500/20">Service</div>
                        )}
                        {isPriceOverridden && (
                            <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1">
                        <div className="relative group/price">
                            <Coins className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 group-focus-within/price:text-primary transition-colors" />
                            <Input 
                                type="number" min="0" step="1"
                                value={item.price}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                onFocus={e => e.target.select()}
                                className={cn(
                                    "h-8 w-28 pl-8 pr-2 text-xs font-black bg-background border-border/60 shadow-sm focus-visible:ring-primary/30 rounded-lg tabular-nums",
                                    isSellingAtLoss ? "text-destructive border-destructive/40" : isPriceOverridden ? "text-blue-600 border-blue-200" : ""
                                )}
                                aria-label={`Modifier le prix de ${item.name}`}
                            />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">/ {item.unit || 'pcs'}</span>
                        
                        {isSellingAtLoss && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="p-1 rounded-lg bg-destructive/5 animate-pulse cursor-help flex items-center gap-1.5 px-3 border border-destructive/20">
                                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                        <span className="text-[10px] font-black text-destructive uppercase">Perte</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-destructive text-white border-none rounded-2xl p-5 shadow-2xl max-w-[280px]">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-center border-b border-white/20 pb-3 mb-1">Alerte : Vente à perte</p>
                                        <p className="text-xs font-medium leading-relaxed">Attention, le prix de vente est inférieur au coût d'achat moyen (PMP).</p>
                                        <p className="text-[11px] font-black text-center mt-2 bg-white/10 py-1.5 rounded-lg">PMP: {formatCurrency(item.purchasePrice)}</p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-col items-center">
                    <div className="flex items-center bg-background rounded-xl border border-border shadow-inner overflow-hidden">
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, Math.max(0, roundQty(item.cartQuantity - 1))); }}
                            className="px-4 h-11 hover:bg-muted text-muted-foreground hover:text-primary transition-all font-black border-r border-border"
                            aria-label="Réduire la quantité"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        
                        <Input
                            ref={qtyInputRef}
                            type="number" min="0" step="0.001"
                            value={item.cartQuantity}
                            onChange={(e) => handleQtyChange(e.target.value)}
                            onFocus={e => e.target.select()}
                            className={cn(
                                "w-20 text-center h-11 bg-transparent border-none shadow-none font-black text-xl focus-visible:ring-0 tabular-nums",
                                isZero ? "text-destructive" : "text-primary"
                            )}
                            aria-label={`Quantité pour ${item.name}`}
                        />

                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, roundQty(item.cartQuantity + 1)); }}
                            className="px-4 h-11 hover:bg-muted text-muted-foreground hover:text-primary transition-all font-black border-l border-border"
                            aria-label="Augmenter la quantité"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="w-36 flex flex-col items-end">
                    <div className="relative group/total">
                        <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 group-focus-within/total:text-primary transition-colors" />
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={isZero ? '0' : Math.round(lineTotal)}
                            onChange={(e) => handleTotalChange(e.target.value)}
                            onFocus={e => e.target.select()}
                            className={cn(
                                "h-11 w-32 pl-9 text-right font-black text-lg tracking-tighter tabular-nums bg-background border-border shadow-sm focus-visible:ring-primary/30 rounded-xl",
                                isZero && "text-muted-foreground/20 line-through"
                            )}
                            aria-label={`Total de ligne pour ${item.name}`}
                        />
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest mt-2 mr-1">Audit Net</p>
                </div>

                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "h-11 w-11 rounded-xl transition-all duration-300",
                        isZero 
                            ? "text-destructive opacity-100 bg-destructive/10" 
                            : "text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => { e.stopPropagation(); onRemove(item.uuid); }}
                    aria-label={`Supprimer ${item.name}`}
                >
                    {isZero ? <X className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
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
            <div className="flex-grow flex flex-col items-center justify-center text-center p-10 space-y-10 animate-in fade-in duration-1000">
                <div className="p-14 rounded-[4rem] bg-muted/10 border-2 border-dashed border-border shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-10 transition-opacity duration-1000" />
                    <ShoppingCart className="h-32 w-32 text-muted-foreground/10 relative z-10 group-hover:scale-110 transition-transform duration-1000" />
                </div>
                <div className="space-y-4 max-w-sm">
                    <p className="text-3xl font-black tracking-tighter text-muted-foreground/40 uppercase">Console de Vente</p>
                    <p className="text-[11px] font-black uppercase text-muted-foreground/20 tracking-[0.5em] leading-relaxed">
                        Prêt pour le prochain encaissement.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="p-6 pb-20">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-8 items-center text-[10px] font-black uppercase text-muted-foreground/50 px-8 mb-8 tracking-[0.25em]">
                    <div className="text-left">Désignation Marchandise</div>
                    <div className="text-center">Volume Flux</div>
                    <div className="text-right">Audit Net (DA)</div>
                    <div className="w-11"></div>
                </div>

                <div className="space-y-4">
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