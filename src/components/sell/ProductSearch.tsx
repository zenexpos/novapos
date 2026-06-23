'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShoppingBag, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useDebouncedAbortSignal } from '@/hooks/useDebounce';
import { productService } from '@/services/product.service';
import { useCartActions, useCartStore } from '@/stores/cartStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomItemDialog } from './CustomItemDialog';

const SearchResultItem = React.memo(({ product, onSelect }: { product: Product, onSelect: (p: Product) => void }) => {
    return (
        <div
            onClick={() => onSelect(product)}
            className="group relative flex flex-col justify-between p-5 cursor-pointer bg-card border border-white/5 rounded-2xl transition-all duration-500 hover:bg-primary/10 hover:border-primary/30 hover:shadow-xl active:scale-95 overflow-hidden"
        >
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                <ShoppingBag className="h-24 w-24 rotate-12" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    {product.quantity <= product.minStockLevel && (
                        <span className="px-2 py-0.5 rounded-lg bg-destructive/10 text-destructive text-[8px] font-black uppercase border border-destructive/20 animate-pulse tracking-tighter">
                            Alerte Stock
                        </span>
                    )}
                </div>
                <p className="text-base font-black leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                </p>
            </div>

            <div className="relative z-10 mt-6 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground opacity-50">Stock: {product.quantity} {product.unit}</span>
                    <span className="text-xl font-black text-primary tracking-tighter tabular-nums">{formatCurrency(product.price)}</span>
                </div>
            </div>
        </div>
    );
});
SearchResultItem.displayName = 'SearchResultItem';

interface ProductSelectorProps {
    isCustomItemOpen: boolean;
    onCustomItemOpenChange: (open: boolean) => void;
}

export const ProductSelector = forwardRef<{ focusInput: () => void }, ProductSelectorProps>((props, ref) => {
    const { isCustomItemOpen, onCustomItemOpenChange } = props;
    const { addItemToCart } = useCartActions();
    const [searchQuery, setSearchQuery] = useState('');
    const { debouncedValue: debouncedSearchQuery, signal } = useDebouncedAbortSignal(searchQuery, 80);

    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const activeCartId = useCartStore(state => state.activeCartId);
    const cartItemsCount = useCartStore(
        (state) => state.carts.find(c => c.id === state.activeCartId)?.items.length ?? 0
    );

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const refocusInput = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    useImperativeHandle(ref, () => ({
        focusInput: refocusInput
    }));

    // إعادة تركيز ذكي بعد إضافة منتج أو تغيير السلة
    useEffect(() => {
        if (isMounted) {
            const timeout = setTimeout(refocusInput, 50);
            return () => clearTimeout(timeout);
        }
    }, [cartItemsCount, activeCartId, isMounted, refocusInput]);

    useEffect(() => {
        if (!debouncedSearchQuery.trim()) {
            setSearchResults([]);
            setSearchError(null);
            return;
        }

        const fetchSearchResults = async () => {
            setIsSearching(true);
            setSearchError(null);
            try {
                const data = await productService.filterProducts({ 
                    query: debouncedSearchQuery,
                    signal
                });
                if (!signal.aborted) {
                    const results = data.slice(0, 15);
                    setSearchResults(results);

                    const q = debouncedSearchQuery.trim();
                    const exactMatch = results.find(p => p.barcodes?.some(b => b === q));
                    if (exactMatch) {
                        handleSelect(exactMatch);
                    }
                }
            } catch (e: any) {
                if (!signal.aborted && e.name !== 'AbortError') {
                    setSearchError("Moteur de recherche indisponible.");
                }
            } finally {
                if (!signal.aborted) setIsSearching(false);
            }
        };

        fetchSearchResults();
    }, [debouncedSearchQuery, signal]);

    const handleSelect = (product: Product) => {
        addItemToCart(product);
        setSearchQuery('');
        setSearchResults([]);
        refocusInput();
    };
    
    const isActiveSearch = searchQuery.trim().length > 0;

    return (
        <div className="flex flex-col h-full bg-muted app-card rounded-lg overflow-hidden border-white/5 shadow-sm">
            <div className="p-6 bg-muted border-b border-white/5 flex gap-4 items-center">
                <div className="relative flex-grow group">
                    <Search className={cn(
                        "absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-500",
                        isActiveSearch ? "text-primary scale-110" : "text-muted-foreground/30"
                    )} />
                    <Input
                        ref={inputRef}
                        placeholder="Scanner ou rechercher [F3]..."
                        className="pl-14 text-lg h-9 rounded-3xl bg-background border-none shadow-inner focus-visible:ring-primary/20 font-black tracking-tight"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchResults.length > 0) {
                                e.preventDefault();
                                handleSelect(searchResults[0]);
                            }
                        }}
                    />
                    {isSearching && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary opacity-40" />
                        </div>
                    )}
                </div>
                <CustomItemDialog isOpen={isCustomItemOpen} onOpenChange={onCustomItemOpenChange}>
                    <Button 
                        variant="outline" 
                        onClick={() => onCustomItemOpenChange(true)}
                        className="h-9 w-auto px-6 flex-shrink-0 rounded-3xl border-none bg-primary/10 hover:bg-primary/20 hover:text-primary transition-all shadow-xl group gap-3" 
                    >
                        <ShoppingBag className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:-rotate-12"/>
                        <span className="text-[10px] font-black uppercase tracking-widest">Manuel [F4]</span>
                    </Button>
                </CustomItemDialog>
            </div>

            <ScrollArea className="flex-grow p-4">
                {searchError ? (
                    <div className="py-20 text-center space-y-4 bg-destructive/5 rounded-2xl border border-dashed border-destructive/20 animate-in zoom-in-95">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto opacity-40" />
                        <p className="text-xs font-bold uppercase text-destructive/70 tracking-widest">{searchError}</p>
                    </div>
                ) : !isActiveSearch ? (
                    <div className="h-full flex flex-col items-center justify-center py-24 text-center space-y-8">
                        <div className="relative p-6 rounded-3xl bg-card border border-white/5 shadow-inner">
                            <Search className="h-16 w-16 text-primary/10" />
                            <div className="absolute -inset-2 bg-primary/5 blur-3xl rounded-full animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-black uppercase text-muted-foreground/30 tracking-[0.2em]">
                                Prêt pour l'indexation [F3]
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground/10 uppercase tracking-widest">
                                Utilisez le lecteur ou saisissez une référence
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between px-3">
                            <h3 className="text-[10px] font-black uppercase text-primary flex items-center gap-3 tracking-widest">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                Résultats Indexés
                            </h3>
                            <span className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-tighter">{searchResults.length} Trouvés</span>
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {searchResults.map(product => (
                                    <SearchResultItem key={product.uuid} product={product} onSelect={handleSelect} />
                                ))}
                            </div>
                        ) : !isSearching && (
                            <div className="py-24 text-center space-y-4 opacity-20 flex flex-col items-center">
                                <ShoppingBag className="h-16 w-16 mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aucun produit répertوريé.</p>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
});
ProductSelector.displayName = "ProductSelector";
