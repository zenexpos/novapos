'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShoppingBag, Loader2, Sparkles } from 'lucide-react';
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
            className="group relative flex items-center justify-between p-3 cursor-pointer bg-card border rounded-lg transition-all hover:bg-primary/5 hover:border-primary/20 active:scale-[0.98]"
        >
            <div className="flex-grow min-w-0 pr-3">
                <p className="text-sm font-bold tracking-tight truncate group-hover:text-primary transition-colors">
                    {product.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">Stock: {product.quantity}</span>
                    {product.quantity <= product.minStockLevel && <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />}
                </div>
            </div>
            <div className="text-right shrink-0">
                <span className="text-base font-black text-primary tracking-tighter tabular-nums">{formatCurrency(product.price)}</span>
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
    const { debouncedValue: debouncedSearchQuery, signal } = useDebouncedAbortSignal(searchQuery, 250);

    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const activeCartId = useCartStore(state => state.activeCartId);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, [activeCartId]);

    useImperativeHandle(ref, () => ({ focusInput: () => inputRef.current?.focus() }));

    useEffect(() => {
        if (!debouncedSearchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const fetchResults = async () => {
            setIsSearching(true);
            try {
                const data = await productService.filterProducts({ query: debouncedSearchQuery, signal });
                if (!signal.aborted) {
                    const results = data.slice(0, 15);
                    setSearchResults(results);
                    // Barcode auto-add
                    if (results.length === 1 && results[0].barcodes?.includes(debouncedSearchQuery.trim())) {
                        addItemToCart(results[0]);
                        setSearchQuery('');
                    }
                }
            } finally {
                if (!signal.aborted) setIsSearching(false);
            }
        };

        fetchResults();
    }, [debouncedSearchQuery, signal, addItemToCart]);

    return (
        <div className="flex flex-col h-full bg-muted/20">
            <div className="p-3 border-b bg-card flex gap-2 items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input
                        ref={inputRef}
                        placeholder="Scanner ou chercher [F3]..."
                        className="pl-9 h-9 text-sm rounded-full bg-muted border-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && searchResults.length > 0) { e.preventDefault(); addItemToCart(searchResults[0]); setSearchQuery(''); } }}
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin opacity-20" />}
                </div>
                <CustomItemDialog isOpen={isCustomItemOpen} onOpenChange={onCustomItemOpenChange}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-primary/10 text-primary">
                        <ShoppingBag className="h-4 w-4"/>
                    </Button>
                </CustomItemDialog>
            </div>

            <ScrollArea className="flex-grow p-3">
                {!searchQuery.trim() ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-10">
                        <Search className="h-10 w-10 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Attente de saisie</p>
                    </div>
                ) : (
                    <div className="space-y-2 animate-in fade-in duration-300">
                        {searchResults.map(product => (
                            <SearchResultItem key={product.uuid} product={product} onSelect={(p) => { addItemToCart(p); setSearchQuery(''); }} />
                        ))}
                        {!isSearching && searchResults.length === 0 && (
                            <p className="text-center py-10 text-[10px] font-bold text-muted-foreground uppercase">Aucun résultat</p>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
});
ProductSelector.displayName = "ProductSelector";
