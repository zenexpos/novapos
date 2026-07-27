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
    'updatedAt_desc': 'Mises à jour',
    'name_asc': 'Désignation (A-Z)',
    'price_desc': 'Prix Vente (Max)',
    'price_asc': 'Prix Vente (Min)',
    'quantity_desc': 'Stock (Décr.)',
    'margin_desc': 'Marge (Max)',
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
            toast.success(`Copie créée.`);
            onDialogSuccess();
        } catch (error: any) {
            toast.error("Échec duplication.");
        }
    }, [onDialogSuccess]);

    const handleViewHistory = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsHistoryDialogOpen(true);
    }, []);

    const handleToggleSelection = useCallback((productUuid: string) => {
        setSelectedProducts(prev => {
            const next = new Set(prev);
            if (next.has(productUuid)) next.delete(productUuid);
            else next.add(productUuid);
            return next;
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
            toast.success(`${selectedProducts.size} items mis à jour.`);
            setSelectedProducts(new Set());
            onDialogSuccess();
        } catch (e) {
            toast.error("Échec bulk update.");
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
            toast.error("Erreur CSV");
        } finally {
            setIsAnalyzing(false);
            e.target.value = ''; 
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await productService.executeImport(confirmedData);
            toast.success("Importation OK.");
            setIsImportPreviewOpen(false);
            onDialogSuccess();
        } catch (error: any) {
            toast.error("Échec import.");
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
            Catégorie: p.category || 'Général'
        })));
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `catalogue-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success("Catalogue exporté.");
    }, [products, selectedProducts]);

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedSupplier('all');
        setStockStatus('all');
        setSortBy('updatedAt_desc');
    };

    const isLoading = productsResult.isLoading || suppliers === undefined;

    useKeyboardShortcuts([
        { key: 'F3', action: () => searchInputRef.current?.focus(), description: 'Chercher', ignoreInputFocus: true },
        { key: 'n', action: () => { setSelectedProduct(null); setIsProductDialogOpen(true); }, description: 'Nouveau', ignoreInputFocus: false }
    ], 'Catalogue');

    const isFiltered = searchQuery !== '' || selectedSupplier !== 'all' || stockStatus !== 'all' || sortBy !== 'updatedAt_desc';
    
    return (
        <div className="p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-500 pb-32">
            <PageHeader
                title="Catalogue Elite"
                description="Contrôle direct du stock et des marges"
                icon={Package}
                className="mb-6"
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={handleExportCsv} className="rounded-xl border-primary/10">
                        <FileUp className="h-3.5 w-3.5 mr-1" /> Exporter
                    </Button>
                    <Button asChild variant="outline" size="sm" disabled={isAnalyzing} className="rounded-xl border-primary/10">
                        <label htmlFor="csv-product-importer" className="cursor-pointer flex items-center">
                            {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Archive className="h-3.5 w-3.5 mr-1" />}
                            Importer
                            <input type="file" id="csv-product-importer" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                        </label>
                    </Button>
                    <Button size="sm" onClick={() => { setSelectedProduct(null); setIsProductDialogOpen(true); }} className="rounded-xl shadow-lg gap-1.5 px-6">
                        <Plus className="h-4 w-4" /> Nouveau [N]
                    </Button>
                </div>
            </PageHeader>

            <InventoryStats isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card/20 p-1.5 rounded-xl border border-white/5 shadow-inner">
                <div className="relative group flex-grow max-w-xl px-2">
                    <Search className={cn(
                        "absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-300",
                        searchQuery ? "text-primary" : "text-muted-foreground/30"
                    )} />
                    <Input 
                        ref={searchInputRef}
                        placeholder="Chercher une référence... [F3]"
                        className="pl-11 h-9 rounded-lg bg-black/20 border-none shadow-inner font-bold"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-2 px-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 rounded-lg border-white/5 bg-black/20 font-bold px-4 gap-2">
                                <Filter className="h-3.5 w-3.5 opacity-40" />
                                {stockStatus === 'all' ? 'Stocks' : 'Filtré'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-white/5 shadow-2xl">
                            <DropdownMenuRadioGroup value={stockStatus} onValueChange={(v: any) => setStockStatus(v)}>
                                <DropdownMenuRadioItem value="all" className="text-xs font-bold">Tous les articles</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="in_stock" className="text-xs font-bold text-emerald-500">En Stock</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="low_stock" className="text-xs font-bold text-amber-500">Stock Faible</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="out_of_stock" className="text-xs font-bold text-red-500">Rupture</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 rounded-lg border-white/5 bg-black/20 font-bold px-4 gap-2">
                                <RefreshCw className="h-3.5 w-3.5 opacity-40" />
                                Trier
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-white/5 shadow-2xl">
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([key, value]) => (
                                    <DropdownMenuRadioItem key={key} value={key} className="text-xs font-bold">{value}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-1 p-1 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-md h-7 w-7" onClick={() => setViewMode('grid')}><LayoutGrid className="h-3.5 w-3.5"/></Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-md h-7 w-7" onClick={() => setViewMode('list')}><List className="h-3.5 w-3.5"/></Button>
                    </div>

                    {isFiltered && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10" onClick={resetFilters}>
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {selectedProducts.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10">
                    <div className="bg-card/80 backdrop-blur-md border-2 border-primary/20 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6">
                        <span className="text-[10px] font-black uppercase text-primary tabular-nums">{selectedProducts.size} sélectionnés</span>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-4">
                            <button onClick={handleExportCsv} className="text-[9px] font-black uppercase hover:text-primary transition-colors">Exporter</button>
                            <button onClick={() => setIsBulkDeleteDialogOpen(true)} className="text-[9px] font-black uppercase text-destructive hover:opacity-80 transition-colors">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="min-h-[500px]">
               {isLoading ? (
                    viewMode === 'grid' ? <ProductGridSkeleton /> : <ProductTableSkeleton />
               ) : products.length === 0 ? (
                    <EmptyState 
                        icon={Archive} 
                        title="Silence de Catalogue" 
                        description={isFiltered ? "Ajustez vos filtres." : "Aucun article enregistré."} 
                        actionLabel="Ajouter un produit"
                        onAction={() => { setSelectedProduct(null); setIsProductDialogOpen(true); }}
                    />
               ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-card/40 border border-white/5 animate-pulse" />
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
