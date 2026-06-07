'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Product } from '@/lib/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { productService } from '@/services/product.service';
import { toast } from 'sonner';

interface ProductIntakeComboboxProps {
    onProductSelected: (product: Product) => void;
    onNewProductCreated: (name: string) => void;
}

export function ProductIntakeCombobox({ onProductSelected, onNewProductCreated }: ProductIntakeComboboxProps) {
    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 200);

    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await productService.getProducts();
                setProducts(data);
            } catch (error: any) {
                toast.error("Impossible de charger les produits.", { description: error.message });
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        if (!debouncedSearchQuery) return products.slice(0, 50); // Limit initial list size
        const lowerQuery = debouncedSearchQuery.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            (p.barcodes && p.barcodes.some(b => b.includes(lowerQuery)))
        );
    }, [products, debouncedSearchQuery]);

    const handleSelect = (productId: string) => {
        const product = products?.find(p => p.uuid === productId);
        if (product) {
            onProductSelected(product);
        }
        setComboboxOpen(false);
        setSearchQuery('');
    };

    const handleCreate = () => {
        onNewProductCreated(searchQuery);
        setComboboxOpen(false);
        setSearchQuery('');
    };

    return (
        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between"
                >
                    Rechercher un produit ou en créer un nouveau...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput 
                        placeholder="Rechercher par nom ou code-barres..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery} 
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="text-center p-4 text-sm">
                                Aucun produit trouvé.
                                {searchQuery && (
                                <Button 
                                    variant="link" 
                                    className="mt-1"
                                    onClick={handleCreate}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Créer le produit "{searchQuery}"
                                </Button>
                                )}
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {filteredProducts?.map((product) => (
                                <CommandItem
                                    key={product.uuid}
                                    value={product.uuid}
                                    onSelect={() => handleSelect(product.uuid)}
                                >
                                    <div>
                                        <p>{product.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Stock: {product.quantity} | Prix Achat: {formatCurrency(product.purchasePrice)}
                                        </p>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
