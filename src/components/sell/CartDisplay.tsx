'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ShoppingCart, Tag, X, Coins, AlertTriangle } from 'lucide-react';
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
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
    onRemove: (uuid: string) => void;
    onSelect: () => void;
}

const CartItemRow = React.memo(({ item, isSelected, onUpdate, onPriceUpdate, onRemove, onSelect }: CartItemRowProps) => {
    const priceInputRef = useRef<HTMLInputElement>(null);
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

    useKeyboardShortcuts([
        {
            key: '+',
            action: () => onUpdate(item.uuid, Number((item.cartQuantity + 1).toFixed(3))),
            description: 'Quantité +1',
            ignoreInputFocus: false
        },
        {
            key: '=',
            action: () => onUpdate(item.uuid, Number((item.cartQuantity + 1).toFixed(3))),
            description: 'Quantité +1',
            ignoreInputFocus: false
        },
        {
            key: '-',
            action: () => onUpdate(item.uuid, Math.max(0, Number((item.cartQuantity - 1).toFixed(3)))),
            description: 'Quantité -1',
            ignoreInputFocus: false
        },
        {
            key: '*',
            action: () => priceInputRef.current?.focus(),
            description: 'Modifier le prix',
            ignoreInputFocus: false
        },
        {
            key: 'q',
            action: () => qtyInputRef.current?.focus(),
            description: 'Focus Quantité',
            ignoreInputFocus: false
        },
        {
            key: 'Delete',
            action: () => onRemove(item.uuid),
            description: 'Supprimer l\'article',
            ignoreInputFocus: true
        }
    ], `Article-${item.uuid}`, isSelected);

    const isCustom = item.uuid.startsWith('custom-');
    const isZero = item.cartQuantity <= 0;
    const isSellingAtLoss = item.price < item.purchasePrice && item.purchasePrice > 0;

    return (
        <div 
            tabIndex={0}
            onFocus={onSelect}
            className={cn(
                "grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center p-4 rounded-2xl border transition-all duration-500 group outline-none",
                isSelected ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20 shadow-sm" : "bg-card/40 border-white/5 hover:bg-card/60",
                isZero && "opacity-50 grayscale",
                item.flash && 'animate-flash ring-2 ring-primary/30'
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
                    {isCustom && <Tag className="h-3 w-3 text-amber-500/50" />}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                    <div className="relative group/price">
                        <Coins className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground/30 group-focus-within/price:text-primary transition-colors" />
                        <Input 
                            ref={priceInputRef}
                            type="number" min="0" step="1"
                            value={item.price}
                            onChange={(e) => handlePriceChange(e.target.value)}
                            onFocus={e => e.target.select()}
                            className={cn(
                                "h-6 w-24 pl-6 pr-1 text-[10px] font-black bg-black/20 border-none shadow-inner focus-visible:ring-primary/20 rounded-lg",
                                isSellingAtLoss && "text-destructive"
                            )}
                        />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">/ {item.unite || 'pcs'}</span>
                    
                    {isSellingAtLoss && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="p-1 rounded-md bg-destructive/10 animate-pulse cursor-help">
                                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-destructive text-white border-none rounded-xl p-3 shadow-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest">
                                        Attention : Vente à perte !<br/>Coût de revient : {formatCurrency(item.purchasePrice)}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col items-center">
                <div className="flex items-center bg-black/20 rounded-xl border border-white/5 overflow-hidden shadow-inner">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, Math.max(0, Number((item.cartQuantity - 1).toFixed(3)))); }}
                        className="px-3 h-10 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors font-black"
                    >
                        −
                    </button>
                    <Input
                        ref={qtyInputRef}
                        type="number" min="0" step="0.001"
                        value={item.cartQuantity}
                        onChange={(e) => handleQtyChange(e.target.value)}
                        onFocus={e => e.target.select()}
                        className={cn(
                            "w-20 text-center h-10 bg-transparent border-none shadow-none font-black text-lg focus-visible:ring-0",
                            isZero ? "text-destructive" : "text-primary"
                        )}
                    />
                    <button 
                        onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, Number((item.cartQuantity + 1).toFixed(3))); }}
                        className="px-3 h-10 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors font-black"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="w-28 text-right">
                <p className={cn(
                    "font-black text-base tracking-tighter tabular-nums",
                    isZero ? "text-muted-foreground/20 line-through" : "text-foreground"
                )}>
                    {formatCurrency(item.price * item.cartQuantity)}
                </p>
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
    );
});
CartItemRow.displayName = 'CartItemRow';

export function CartDisplay() {
    const [isMounted, setIsMounted] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const cart = useActiveCart();
    const { updateItemQuantity, updateItemPrice, removeItemFromCart } = useCartActions();
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

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
            <div className="flex-grow flex flex-col items-center justify-center text-center p-10 space-y-6 animate-in fade-in duration-1000">
                <div className="p-8 rounded-3xl bg-muted/20 border border-white/5 shadow-inner">
                    <ShoppingCart className="h-24 w-24 text-muted-foreground/10" />
                </div>
                <div className="space-y-2">
                    <p className="text-xl font-black tracking-tighter text-muted-foreground/20 uppercase">Saisie Commerciale</p>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground/10 tracking-[0.3em]">En attente de flux catalogue...</p>
                </div>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="p-6">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center text-[9px] font-black uppercase text-muted-foreground/40 px-6 mb-6 tracking-widest">
                    <div className="text-left">Désignation Produit</div>
                    <div className="text-center">Quantité Flux</div>
                    <div className="text-right">Total HT</div>
                    <div></div>
                </div>

                <div className="space-y-3">
                    {cart.items.map((item, index) => (
                        <CartItemRow 
                            key={item.uuid} 
                            item={item} 
                            isSelected={selectedIndex === index}
                            onUpdate={updateItemQuantity} 
                            onPriceUpdate={updateItemPrice}
                            onRemove={removeItemFromCart} 
                            onSelect={() => setSelectedIndex(index)}
                        />
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
}
