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
    Printer, 
    Trash2, 
    SortAsc, 
    Package, 
    Loader2, 
    FileUp, 
    RefreshCw,
    X,
    FileDown
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
import {
  DropdownMenu,
  DropdownMenuContent,
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

type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';

const sortOptions: { [key: string]: string } = {
    'name_asc': 'Nom (A-Z)',
    'price_desc': 'Prix (Max)',
    'price_asc': 'Prix (Min)',
    'quantity_desc': 'Stock (Max)',
    'createdAt_desc': 'Plus récents',
    'dateExpiration_asc': 'Expiration proche',
};

function ProductsContent() {
    const searchParams = useSearchParams();
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    const viewMode = useAppStore(state => state.productViewMode);
    const setViewMode = useAppStore(state => state.actions.setProductViewMode);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [stockStatus, setStockStatus] = useState<StockStatus>('all');
    const [sortBy, setSortBy] = useState('createdAt_desc');

    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const debounced = useDebouncedAbortSignal(searchQuery, 300);

    const productsResult = useLiveQuery<Product[]>(
        () => productService.filterProducts({ 
            query: debounced.debouncedValue, 
            supplierUuid: selectedSupplier,
            stockStatus, 
            sortBy 
        }),
        [debounced.debouncedValue, selectedSupplier, stockStatus, sortBy]
    );
    const products = productsResult.value ?? [];

    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const isLoading = productsResult.isLoading || suppliers === undefined;
    
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ProductImportAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        const statusFromQuery = searchParams.get('stockStatus') as StockStatus;
        if (statusFromQuery) setStockStatus(statusFromQuery);
        const queryFromUrl = searchParams.get('query');
        if (queryFromUrl) setSearchQuery(queryFromUrl);
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
    }, [fetchMeta, productsResult]);

    const handleEditProduct = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsProductDialogOpen(true);
    }, []);

    const handleDuplicateProduct = useCallback(async (product: Product) => {
        try {
            await productService.duplicateProduct(product.uuid);
            toast.success(`Produit "${product.name}" dupliqué.`);
        } catch (error: any) {
            toast.error("Échec de la duplication.");
        }
    }, []);

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

    const handleConfirmDeleteProduct = useCallback(async () => {
        if (!selectedProduct) return;
        await productService.deleteProduct(selectedProduct.uuid);
        setIsDeleteDialogOpen(false);
        productsResult.refresh();
        fetchMeta();
    }, [selectedProduct, productsResult, fetchMeta]);

    const handleConfirmDeleteMultipleProducts = useCallback(async () => {
        if (selectedProducts.size === 0) return;
        await productService.bulkDelete(Array.from(selectedProducts));
        setIsBulkDeleteDialogOpen(false);
        setSelectedProducts(new Set());
        productsResult.refresh();
        fetchMeta();
    }, [selectedProducts, productsResult, fetchMeta]);

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
            Prix_Vente: p.price,
            Prix_Achat: p.purchasePrice,
            Stock: p.quantity,
            Unité: p.unite,
        })));
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ipos-produits-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success("Exportation terminée.");
    }, [products, selectedProducts]);

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedSupplier('all');
        setStockStatus('all');
        setSortBy('createdAt_desc');
    };

    useKeyboardShortcuts([
        {
            key: 'F3',
            action: () => searchInputRef.current?.focus(),
            description: 'Rechercher un produit',
            ignoreInputFocus: true
        },
        {
            key: 'n',
            action: () => { setSelectedProduct(null); setIsProductDialogOpen(true); },
            description: 'Nouveau produit',
            ignoreInputFocus: false
        }
    ], 'Catalogue');

    const isFiltered = searchQuery !== '' || selectedSupplier !== 'all' || stockStatus !== 'all' || sortBy !== 'createdAt_desc';
    
    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader
                title="Catalogue Elite"
                description="Maîtrise absolue du catalogue et des actifs"
            >
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportCsv} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide border-primary/20 hover:bg-primary/5">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button asChild variant="outline" disabled={isAnalyzing} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide border-primary/20 hover:bg-primary/5">
                        <label htmlFor="csv-product-importer" className="cursor-pointer flex items-center">
                            {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4 text-primary" />}
                            Importer
                            <input type="file" id="csv-product-importer" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                        </label>
                    </Button>
                    <Button onClick={() => { setSelectedProduct(null); setIsProductDialogOpen(true); }} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide shadow-xl shadow-sm transition-all active:scale-95">
                        <Plus className="mr-2 h-4 w-4" /> Nouveau [N]
                    </Button>
                </div>
            </PageHeader>

            <InventoryStats isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/20 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
                <div className="relative group flex-grow max-w-xl px-4">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-500" />
                    <Input 
                        ref={searchInputRef}
                        placeholder="Rechercher un produit [F3]..."
                        className="pl-14 h-9 rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20 font-bold text-lg"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex wrap items-center gap-3 px-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-12 rounded-xl border-white/5 bg-black/20 hover:bg-white/5 font-bold px-6">
                                <SortAsc className="mr-2 h-4 w-4 opacity-50" />
                                {sortOptions[sortBy] || 'Trier par'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-2xl border-white/5 shadow-sm min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Trier par</DropdownMenuLabel>
                            <DropdownMenuSeparator className="opacity-10" />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([key, value]) => (
                                    <DropdownMenuRadioItem key={key} value={key} className="text-xs font-bold">{value}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-1 p-1 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-10 w-10" onClick={() => setViewMode('grid')}><LayoutGrid className="h-5 w-5"/></Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-10 w-10" onClick={() => setViewMode('list')}><List className="h-5 w-5"/></Button>
                    </div>

                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/5 bg-card/40" onClick={onDialogSuccess} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-5 w-5 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {selectedProducts.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-sm rounded-full px-8 py-4 flex items-center gap-4">
                        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                            <Checkbox
                                id="select-all-products"
                                checked={!isLoading && products && products.length > 0 && selectedProducts.size === products.length}
                                onCheckedChange={handleToggleSelectAll}
                                className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                            />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Sélection Elite</span>
                                <span className="text-xs font-semibold text-primary">{selectedProducts.size} produit(s)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => setIsPrintDialogOpen(true)} className="rounded-full h-12 px-6 font-semibold text-[10px] uppercase tracking-wide hover:bg-primary/10 hover:text-primary">
                                <Printer className="mr-2 h-4 w-4" /> Étiquettes
                            </Button>
                            <Button variant="ghost" onClick={handleExportCsv} className="rounded-full h-12 px-6 font-semibold text-[10px] uppercase tracking-wide hover:bg-primary/10 hover:text-primary">
                                <FileUp className="mr-2 h-4 w-4" /> Exporter (.csv)
                            </Button>
                            <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(true)} className="rounded-full h-12 px-6 font-semibold text-[10px] uppercase tracking-wide text-destructive hover:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedProducts(new Set())} className="rounded-full h-12 w-12 hover:bg-white/5 transition-all">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="min-h-[600px] animate-in fade-in duration-500">
               {isLoading ? (
                    viewMode === 'grid' ? <ProductGridSkeleton /> : <ProductTableSkeleton />
               ) : products.length === 0 ? (
                    <EmptyState icon={Package} title="Catalogue Vide" description={isFiltered ? "Ajustez vos filtres pour trouver ce que vous cherchez." : "Commencez à bâtir votre catalogue."} />
               ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
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
                        <ProductTable products={products} onEdit={handleEditProduct} onDuplicate={handleDuplicateProduct} onHistory={handleViewHistory} onDelete={(p) => { setSelectedProduct(p); setIsDeleteDialogOpen(true); }} selectedProducts={selectedProducts} onToggleProductSelection={handleToggleSelection} onToggleSelectAll={handleToggleSelectAll} suppliers={suppliers || []} />
                    )
               )}
            </div>

            <ProductDialog isOpen={isProductDialogOpen} onOpenChange={setIsProductDialogOpen} product={selectedProduct} suppliers={suppliers || []} onSuccess={onDialogSuccess} />
            <DeleteProductDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} name={selectedProduct?.name} onConfirm={handleConfirmDeleteProduct} />
            <PrintLabelsDialog isOpen={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen} productUuids={Array.from(selectedProducts)} />
            <DeleteMultipleProductsDialog isOpen={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen} count={selectedProducts.size} onConfirm={handleConfirmDeleteMultipleProducts} />
            <ProductImportPreviewDialog isOpen={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen} analysis={importAnalysis} onConfirm={handleConfirmImport} isImporting={isImporting} />
            <ProductHistoryDialog isOpen={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen} product={selectedProduct} />
        </div>
    );
}

function ProductGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="h-[220px] rounded-lg bg-card/40 border-white/5 animate-pulse" />
            ))}
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="p-4 text-center text-[10px] font-semibold uppercase opacity-20 animate-pulse">Chargement du catalogue...</div>}>
            <ProductsContent />
        </Suspense>
    );
}