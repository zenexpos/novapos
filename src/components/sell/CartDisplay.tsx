'use client';

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, X, Coins, AlertTriangle, Calculator, Edit3, Info, Minus, Plus } from 'lucide-react';
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
 * PRODUCTION PERFORMANCE FIX: React.memo with exhaustive props validation.
 * Ensures rows only re-render when their specific data changes.
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
                            "font-bold text-sm tracking-tight truncate group-hover:text-primary transition-colors",
                            isZero && "text-muted-foreground line-through"
                        )}>
                            {item.name}
                        </p>
                        {isCustom && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase cursor-help">Manuel</div>
                                </TooltipTrigger>
                                <TooltipContent>Article ajouté manuellement بدون code-barres.</TooltipContent>
                            </Tooltip>
                        )}
                        {isPriceOverridden && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Edit3 className="h-3 w-3 text-blue-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Le prix original de cet article a été modifié manuellement.</TooltipContent>
                            </Tooltip>
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
                                    "h-7 w-24 pl-6 pr-1 text-[10px] font-black bg-background border-border shadow-sm focus-visible:ring-primary/20 rounded-lg",
                                    isSellingAtLoss ? "text-destructive border-destructive/30" : isPriceOverridden ? "text-blue-600 border-blue-200" : ""
                                )}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">/ {item.unit || 'pcs'}</span>
                        
                        {isSellingAtLoss && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="p-1 rounded-md bg-destructive/10 animate-pulse cursor-help flex items-center gap-1 px-2 border border-destructive/20">
                                        <AlertTriangle className="h-3 w-3 text-destructive" />
                                        <span className="text-[8px] font-black text-destructive uppercase">Perte</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-destructive text-white border-none rounded-xl p-4 shadow-2xl max-w-[250px]">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-center border-b border-white/20 pb-2 mb-2">Attention : Vente à perte !</p>
                                        <p className="text-[9px] font-medium leading-relaxed">Le prix de vente est inférieur à votre coût d'achat moyen (PMP).</p>
                                        <p className="text-[10px] font-black text-center mt-2">PMP: {formatCurrency(item.purchasePrice)}</p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-col items-center">
                    <div className="flex items-center bg-background rounded-xl border border-border overflow-hidden shadow-sm">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, Math.max(0, roundQty(item.cartQuantity - 1))); }}
                                        className="px-3 h-10 hover:bg-muted text-muted-foreground hover:text-primary transition-colors font-black"
                                    >
                                        <Minus className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Réduire</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        
                        <Input
                            ref={qtyInputRef}
                            type="number" min="0" step="0.001"
                            value={item.cartQuantity}
                            onChange={(e) => handleQtyChange(e.target.value)}
                            onFocus={e => e.target.select()}
                            className={cn(
                                "w-16 text-center h-10 bg-transparent border-none shadow-none font-black text-lg focus-visible:ring-0",
                                isZero ? "text-destructive" : "text-primary"
                            )}
                        />

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, roundQty(item.cartQuantity + 1)); }}
                                        className="px-3 h-10 hover:bg-muted text-muted-foreground hover:text-primary transition-colors font-black"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Augmenter</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
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
                    <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1 mr-1">Sous-total HT</p>
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
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
                        </TooltipTrigger>
                        <TooltipContent>Retirer du panier</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </TooltipProvider>
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
            description: 'Ligne precedente',
            ignoreInputFocus: true
        }
    ], 'ListePanier', isMounted && !!cart?.items.length);

    if (!isMounted) return null;
    
    if (!cart || cart.items.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-10 space-y-6 animate-in fade-in duration-1000">
                <div className="p-8 rounded-3xl bg-muted/20 border border-border shadow-inner">
                    <Calculator className="h-24 w-24 text-muted-foreground/10" />
                </div>
                <div className="space-y-4">
                    <p className="text-2xl font-black tracking-tighter text-muted-foreground/30 uppercase">Prêt pour une vente</p>
                    <p className="text-[11px] font-bold uppercase text-muted-foreground/15 tracking-[0.4em] leading-relaxed max-w-[300px] mx-auto">Scanneز un article ou recherchez un produit pour commencer.</p>
                </div>
                <div className="pt-8 opacity-40">
                    <div className="flex items-center gap-6 px-8 py-3 rounded-full border border-border bg-muted/20 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">F3</kbd> Chercher</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">F4</kbd> Manuel</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="p-6">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center text-[9px] font-black uppercase text-muted-foreground/40 px-6 mb-6 tracking-widest">
                    <div className="text-left">Désignation de l'article</div>
                    <div className="text-center">Ajuster Quantité</div>
                    <div className="text-right">Total HT</div>
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
