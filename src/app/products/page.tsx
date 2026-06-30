'use client';
import React from 'react';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedAbortSignal } from '@/hooks/useDebounce';
import type { Product, Supplier, ProductImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Plus, 
    Search, 
    LayoutGrid, 
    List, 
    Trash2, 
    Package, 
    Loader2, 
    FileUp, 
    RefreshCw,
    X,
    FilterX,
    Archive,
    Filter,
    Tag
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { ProductTable } from '@/components/products/product-table';
import { ProductTableSkeleton } from '@/components/products/product-table-skeleton';
import { ProductDialog } from '@/components/products/product-dialog';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { DeleteMultipleProductsDialog } from '@/components/products/DeleteMultipleProductsDialog';
import { PrintLabelsDialog } from '@/components/products/PrintLabelsDialog';
import { InventoryStats } from '@/components/products/InventoryStats';
import { ProductImportPreviewDialog } from '@/components/products/ProductImportPreviewDialog';
import { ProductHistoryDialog } from '@/components/products/ProductHistoryDialog';
import { ProductDetailsSheet } from '@/components/products/ProductDetailsSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { productService } from '@/services/product.service';
import { supplierService } from '@/services/supplier.service';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import Papa from 'papaparse';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

type StockStatusFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring_soon' | 'expired';

const sortOptions: { [key: string]: string } = {
    'updatedAt_desc': 'Dernières mises à jour',
    'name_asc': 'Désignation (A-Z)',
    'price_desc': 'Prix Vente (Max)',
    'price_asc': 'Prix Vente (Min)',
    'quantity_desc': 'Stock (Décroissant)',
    'margin_desc': 'Marge (Plus rentables)',
};

function ProductsContent() {
    const searchParams = useSearchParams();
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    const viewMode = useAppStore(state => state.productViewMode);
    const setViewMode = useAppStore(state => state.actions.setProductViewMode);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [stockStatus, setStockStatus] = useState<StockStatusFilter>('all');
    const [sortBy, setSortBy] = useState('updatedAt_desc');

    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const debounced = useDebouncedAbortSignal(searchQuery, 300);

    const productsResult = useLiveQuery<Product[]>(
        () => productService.filterProducts({ query: debounced.debouncedValue, supplierUuid: selectedSupplier, stockStatus: stockStatus as any, sortBy }),
        [debounced.debouncedValue, selectedSupplier, stockStatus, sortBy]
    );
    const products = productsResult.value ?? [];

    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);
    
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ProductImportAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const categoriesResult = useLiveQuery<string[]>(async () => {
        const prods = await productService.getProducts();
        return Array.from(new Set(prods.map(p => p.category).filter(Boolean) as string[])).sort();
    }, []);
    const categories = categoriesResult.value ?? [];

    useEffect(() => {
        const statusFromQuery = searchParams.get('stockStatus') as StockStatusFilter;
        if (statusFromQuery) setStockStatus(statusFromQuery);
    }, [searchParams]);

    const fetchMeta = useCallback(async () => {
        try {
            const sups = await supplierService.getSuppliers();
            setSuppliers(sups);
        } catch(error: any) {
            setSuppliers([]);
        }
    }, []);

    useEffect(() => {
        fetchMeta();
    }, [fetchMeta]);
    
    useEffect(() => {
        setSelectedProducts(new Set());
    }, [stockStatus, selectedSupplier, debounced.debouncedValue]);

    const onDialogSuccess = useCallback(() => {
        fetchMeta();
        productsResult.refresh();
        categoriesResult.refresh();
    }, [fetchMeta, productsResult, categoriesResult]);

    const handleEditProduct = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsProductDialogOpen(true);
    }, []);

    const handleSelectProduct = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsDetailsSheetOpen(true);
    }, []);

    const handleDuplicateProduct = useCallback(async (product: Product) => {
        try {
            await productService.duplicateProduct(product.uuid);
            toast.success(`Produit "${product.name}" dupliqué.`);
            onDialogSuccess();
        } catch (error: any) {
            toast.error("Échec de la duplication.");
        }
    }, [onDialogSuccess]);

    const handleViewHistory = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsHistoryDialogOpen(true);
    }, []);

    const handleToggleSelection = useCallback((productUuid: string) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productUuid)) newSet.delete(productUuid);
            else newSet.add(productUuid);
            return newSet;
        });
    }, []);
    
    const handleToggleSelectAll = useCallback(() => {
        if (!products) return;
        if (selectedProducts.size === products.length) setSelectedProducts(new Set());
        else setSelectedProducts(new Set(products.map(p => p.uuid)));
    }, [products, selectedProducts.size]);

    const handleBulkCategoryChange = async (category: string) => {
        if (selectedProducts.size === 0) return;
        try {
            await productService.bulkUpdate(Array.from(selectedProducts), { category });
            toast.success(`${selectedProducts.size} produits déplacés vers ${category}.`);
            setSelectedProducts(new Set());
            onDialogSuccess();
        } catch (e) {
            toast.error("Échec de la mise à jour groupée.");
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAnalyzing(true);
        try {
            const analysis = await productService.analyzeImport(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur d'analyse CSV");
        } finally {
            setIsAnalyzing(false);
            e.target.value = ''; 
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await productService.executeImport(confirmedData);
            toast.success("Importation réussie.");
            setIsImportPreviewOpen(false);
            onDialogSuccess();
        } catch (error: any) {
            toast.error("Échec de l'importation.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleExportCsv = useCallback(() => {
        if (!products || products.length === 0) return;
        const dataToExport = selectedProducts.size > 0 
            ? products.filter(p => selectedProducts.has(p.uuid))
            : products;

        const csv = Papa.unparse(dataToExport.map(p => ({
            Désignation: p.name,
            Code_Barres: p.barcodes?.[0] || '',
            Prix_Vente: p.price,
            PMP: p.purchasePrice,
            Stock: p.quantity,
            Seuil_Alerte: p.minStockLevel,
            Unité: p.unit || 'PCS',
            Catégorie: p.category || 'Général',
            Dernière_Vente: p.lastSaleDate ? new Date(p.lastSaleDate).toLocaleDateString() : 'N/A'
        })));
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventaire-elite-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success("Manifeste exporté.");
    }, [products, selectedProducts]);

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedSupplier('all');
        setStockStatus('all');
        setSortBy('updatedAt_desc');
    };

    const isLoading = productsResult.isLoading || suppliers === undefined;

    useKeyboardShortcuts([
        { key: 'F3', action: () => searchInputRef.current?.focus(), description: 'Rechercher un produit', ignoreInputFocus: true },
        { key: 'n', action: () => { setSelectedProduct(null); setIsProductDialogOpen(true); }, description: 'Nouveau produit', ignoreInputFocus: false }
    ], 'Catalogue');

    const isFiltered = searchQuery !== '' || selectedSupplier !== 'all' || stockStatus !== 'all' || sortBy !== 'updatedAt_desc';
    
    return (
        <div className="p-6 sm:p-4 space-y-8 max-w-[1800px] mx-auto animate-in fade-in duration-1000 pb-32">
            <PageHeader
                title="Management du Catalogue Elite"
                description="Contrôle absolu des stocks, marges et flux marchandises"
                icon={Package}
            >
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportCsv} className="flex-1 sm:flex-none h-11 rounded-xl font-bold border-primary/20 hover:bg-primary/5 shadow-sm">
                        <FileUp className="mr-2 h-4 w-4" /> Exporter Manifeste
                    </Button>
                    <Button asChild variant="outline" disabled={isAnalyzing} className="flex-1 sm:flex-none h-11 rounded-xl font-bold border-primary/20 hover:bg-primary/5 shadow-sm">
                        <label htmlFor="csv-product-importer" className="cursor-pointer flex items-center">
                            {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                            Importer Flux
                            <input type="file" id="csv-product-importer" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                        </label>
                    </Button>
                    <Button onClick={() => { setSelectedProduct(null); setIsProductDialogOpen(true); }} className="flex-1 sm:flex-none h-11 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 gap-3">
                        <Plus className="mr-2 h-4 w-4" /> Nouvel Article [N]
                    </Button>
                </div>
            </PageHeader>

            <InventoryStats isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/20 p-2.5 rounded-lg border border-white/5 backdrop-blur-sm shadow-inner">
                <div className="relative group flex-grow max-w-xl px-4">
                    <Search className={cn(
                        "absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-500",
                        searchQuery ? "text-primary" : "text-muted-foreground/30"
                    )} />
                    <Input 
                        ref={searchInputRef}
                        placeholder="Scanner ou chercher une référence [F3]..."
                        className="pl-14 h-11 rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20 font-black text-lg tracking-tight"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground/20 hover:text-destructive transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 px-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-xl border-white/5 bg-black/20 hover:bg-white/5 font-black text-[10px] uppercase tracking-widest px-6 gap-3">
                                <Filter className="h-4 w-4 opacity-50" />
                                {stockStatus === 'all' ? 'Tous les Stocks' : 
                                 stockStatus === 'low_stock' ? 'Stock Faible' : 
                                 stockStatus === 'out_of_stock' ? 'Rupture' : 
                                 stockStatus === 'overstock' ? 'Excédent' : 'Filtrer'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-2xl border-white/5 shadow-2xl min-w-[240px] bg-card/95 backdrop-blur-md">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 px-4 py-3">Statut du Stock</DropdownMenuLabel>
                            <DropdownMenuSeparator className="opacity-10" />
                            <DropdownMenuRadioGroup value={stockStatus} onValueChange={(v: any) => setStockStatus(v)}>
                                <DropdownMenuRadioItem value="all" className="text-xs font-bold py-3 px-4">Tous les articles</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="in_stock" className="text-xs font-bold py-3 px-4 text-emerald-500">En Stock</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="low_stock" className="text-xs font-bold py-3 px-4 text-amber-500">Stock Faible</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="out_of_stock" className="text-xs font-bold py-3 px-4 text-red-500">Rupture de Stock</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="overstock" className="text-xs font-bold py-3 px-4 text-blue-500">Excédent de Stock</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-xl border-white/5 bg-black/20 hover:bg-white/5 font-black text-[10px] uppercase tracking-widest px-6 gap-3">
                                <RefreshCw className="h-4 w-4 opacity-50" />
                                {sortOptions[sortBy] || 'Trier'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-2xl border-white/5 shadow-2xl min-w-[240px] bg-card/95 backdrop-blur-md">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 px-4 py-3">Organiser par</DropdownMenuLabel>
                            <DropdownMenuSeparator className="opacity-10" />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([key, value]) => (
                                    <DropdownMenuRadioItem key={key} value={key} className="text-xs font-bold py-3 px-4 focus:bg-primary/10">{value}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-1 p-1 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9 transition-all" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-9 w-9 transition-all" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                    </div>

                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-white/5 bg-card/40 hover:bg-primary/5 transition-all group" onClick={onDialogSuccess}>
                        <RefreshCw className="h-4 w-4 text-primary group-hover:rotate-180 transition-transform duration-700" />
                    </Button>
                    
                    {isFiltered && (
                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10" onClick={resetFilters}>
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {selectedProducts.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-2xl rounded-full px-8 py-4 flex items-center gap-6">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                            <Checkbox
                                id="select-all-products"
                                checked={!isLoading && products && products.length > 0 && selectedProducts.size === products.length}
                                onCheckedChange={handleToggleSelectAll}
                                className="h-6 w-6 border-primary data-[state=checked]:bg-primary rounded-lg"
                            />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Articles Choisis</span>
                                <span className="text-sm font-black text-primary tabular-nums">{selectedProducts.size} produit(s)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">
                                        <Tag className="h-4 w-4" /> Catégorie
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="rounded-xl border-white/5 shadow-xl max-h-60 overflow-y-auto">
                                    <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Appliquer à la sélection</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="opacity-10" />
                                    {categories.map(cat => (
                                        <DropdownMenuItem key={cat} onClick={() => handleBulkCategoryChange(cat)} className="text-xs font-bold uppercase p-3">
                                            {cat}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button onClick={() => setIsPrintDialogOpen(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">
                                <Archive className="h-4 w-4" /> Étiquettes
                            </button>
                            <button onClick={handleExportCsv} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">
                                <FileUp className="mr-2 h-4 w-4" /> Exporter
                            </button>
                            <button onClick={() => setIsBulkDeleteDialogOpen(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-destructive hover:opacity-80 transition-colors">
                                <Trash2 className="h-4 w-4" /> Supprimer
                            </button>
                            <button onClick={() => setSelectedProducts(new Set())} className="p-2 rounded-full hover:bg-white/5 transition-all ml-4">
                                <X className="h-4 w-4 opacity-40" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="min-h-[600px] animate-in fade-in duration-500">
               {isLoading ? (
                    viewMode === 'grid' ? <ProductGridSkeleton /> : <ProductTableSkeleton />
               ) : products.length === 0 ? (
                    <EmptyState 
                        icon={Archive} 
                        title="Silence de Catalogue" 
                        description={isFiltered ? "Ajustez vos filtres pour identifier las références." : "Commencez par ajouter votre premier article Elite."} 
                        actionLabel="Ajouter un produit"
                        onAction={() => { setSelectedProduct(null); setIsProductDialogOpen(true); }}
                    />
               ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {products.map(p => (
                                <ProductCard 
                                    key={p.uuid} 
                                    product={p} 
                                    onEdit={handleEditProduct} 
                                    onDuplicate={handleDuplicateProduct} 
                                    onHistory={handleViewHistory} 
                                    onDelete={() => { setSelectedProduct(p); setIsDeleteDialogOpen(true); }} 
                                    isSelected={selectedProducts.has(p.uuid)} 
                                    onToggleSelection={() => handleToggleSelection(p.uuid)} 
                                    isSelectionActive={selectedProducts.size > 0}
                                />
                            ))}
                        </div>
                    ) : (
                        <ProductTable 
                            products={products} 
                            onEdit={handleEditProduct} 
                            onDuplicate={handleDuplicateProduct} 
                            onHistory={handleViewHistory} 
                            onDelete={(p) => { setSelectedProduct(p); setIsDeleteDialogOpen(true); }} 
                            onSelect={handleSelectProduct}
                            selectedProducts={selectedProducts} 
                            onToggleProductSelection={handleToggleSelection} 
                            onToggleSelectAll={handleToggleSelectAll} 
                            suppliers={suppliers || []} 
                        />
                    )
               )}
            </div>

            <ProductDialog isOpen={isProductDialogOpen} onOpenChange={setIsProductDialogOpen} product={selectedProduct} suppliers={suppliers || []} onSuccess={onDialogSuccess} />
            <DeleteProductDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} name={selectedProduct?.name} onConfirm={() => {
                if (selectedProduct) productService.deleteProduct(selectedProduct.uuid).then(() => { setIsDeleteDialogOpen(false); productsResult.refresh(); });
            }} />
            <PrintLabelsDialog isOpen={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen} productUuids={Array.from(selectedProducts)} />
            <DeleteMultipleProductsDialog isOpen={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen} count={selectedProducts.size} onConfirm={() => {
                productService.bulkDelete(Array.from(selectedProducts)).then(() => { setIsBulkDeleteDialogOpen(false); setSelectedProducts(new Set()); productsResult.refresh(); });
            }} />
            <ProductImportPreviewDialog isOpen={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen} analysis={importAnalysis} onConfirm={handleConfirmImport} isImporting={isImporting} />
            <ProductHistoryDialog isOpen={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen} product={selectedProduct} />
            <ProductDetailsSheet isOpen={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen} product={selectedProduct} onEdit={() => { setIsDetailsSheetOpen(false); if(selectedProduct) handleEditProduct(selectedProduct); }} />
        </div>
    );
}

function ProductGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="h-[250px] rounded-2xl bg-card/40 border border-white/5 animate-pulse" />
            ))}
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center opacity-20"><Loader2 className="h-10 w-10 animate-spin mx-auto" /></div>}>
            <ProductsContent />
        </Suspense>
    );
}
