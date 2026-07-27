'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShoppingBag, Loader2 } from 'lucide-react';
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
            className="group flex items-center justify-between px-3 py-2 cursor-pointer bg-card border border-transparent rounded-md transition-all hover:bg-primary/5 hover:border-primary/10 active:scale-[0.98] h-10"
        >
            <div className="flex-grow min-w-0 pr-3">
                <p className="text-[12px] font-bold tracking-tight truncate group-hover:text-primary transition-colors">
                    {product.name}
                </p>
            </div>
            <div className="text-right shrink-0 flex items-center gap-3">
                {product.quantity <= product.minStockLevel && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                <span className="text-[13px] font-black text-primary tabular-nums tracking-tighter">{formatCurrency(product.price)}</span>
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
    const { debouncedValue: debouncedSearchQuery, signal } = useDebouncedAbortSignal(searchQuery, 200);

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
                    const results = data.slice(0, 20);
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
        <div className="flex flex-col h-full bg-muted/10">
            <div className="p-2 border-b bg-card flex gap-2 items-center h-12">
                <div className="relative flex-grow h-8">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
                    <input
                        ref={inputRef}
                        placeholder="Scanner / Chercher [F3]..."
                        className="pl-8 h-full w-full text-xs rounded-md bg-muted/50 border-none focus:outline-none focus:ring-1 focus:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && searchResults.length > 0) { e.preventDefault(); addItemToCart(searchResults[0]); setSearchQuery(''); } }}
                    />
                    {isSearching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin opacity-20" />}
                </div>
                <CustomItemDialog isOpen={isCustomItemOpen} onOpenChange={onCustomItemOpenChange}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md bg-primary/5 text-primary hover:bg-primary/10">
                        <ShoppingBag className="h-3.5 w-3.5"/>
                    </Button>
                </CustomItemDialog>
            </div>

            <ScrollArea className="flex-grow">
                <div className="p-2 space-y-0.5">
                    {!searchQuery.trim() ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 opacity-5">
                            <Search size={48} />
                        </div>
                    ) : (
                        searchResults.map(product => (
                            <SearchResultItem key={product.uuid} product={product} onSelect={(p) => { addItemToCart(p); setSearchQuery(''); }} />
                        ))
                    )}
                    {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
                        <p className="text-center py-10 text-[9px] font-black uppercase text-muted-foreground/30 tracking-widest">Aucun résultat</p>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
});
ProductSelector.displayName = "ProductSelector";
