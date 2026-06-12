'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Product, Supplier, ProductCreateInput } from '@/lib/types';
import { Loader2, X, AlertTriangle, ChevronsUpDown, Plus, Package, Hash, Box, Building, Coins, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePicker } from '../ui/date-picker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { productService } from '@/services/product.service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn, safeNumber, formatCurrency } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface ProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
    suppliers: Supplier[];
    onSuccess: () => void;
}

const initialFormState: Partial<Product> & { supplierName?: string } = {
    name: '',
    price: 0,
    purchasePrice: 0,
    quantity: 0,
    minStockLevel: 10,
    barcodes: [],
    unit: 'Pièce',
    dateExpiration: undefined,
    supplierUuid: undefined,
    supplierName: '',
};

const units: NonNullable<Product['unit']>[] = ['Pièce', 'Kg', 'Litre', 'Boîte', 'Carton', 'Sachet', 'Bouteille'];

export function ProductDialog({ isOpen, onOpenChange, product, suppliers, onSuccess }: ProductDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [currentBarcode, setCurrentBarcode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPriceConfirm, setShowPriceConfirm] = useState(false);

    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);

    useEffect(() => {
        if (product && isOpen) {
            const supplier = suppliers.find(s => s.uuid === product.supplierUuid);
            setFormState({
                ...product,
                dateExpiration: product.dateExpiration ? new Date(product.dateExpiration) : undefined,
                supplierName: supplier?.name || '',
            });
        } else if (!product && isOpen) {
            setFormState(initialFormState);
        }
        setError(null);
    }, [product, isOpen, suppliers]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormState(prev => ({ 
            ...prev, 
            [id]: type === 'number' ? (value === '' ? undefined : value) : value 
        }));
    };

    const handleAddBarcode = () => {
        if (currentBarcode.trim() && !formState.barcodes?.includes(currentBarcode.trim())) {
            setFormState(prev => ({ ...prev, barcodes: [...(prev.barcodes || []), currentBarcode.trim()] }));
            setCurrentBarcode('');
        }
    };
    
    const handleRemoveBarcode = (barcodeToRemove: string) => {
        setFormState(prev => ({...prev, barcodes: prev.barcodes?.filter(b => b !== barcodeToRemove)}));
    };

    const handleSupplierSelect = (uuid: string) => {
        const selected = suppliers.find(s => s.uuid === uuid);
        if (selected) setFormState(prev => ({ ...prev, supplierUuid: selected.uuid, supplierName: selected.name }));
        setSupplierPopoverOpen(false);
    };

    const proceedWithSubmit = async () => {
        setError(null);
        setIsLoading(true);
        try {
            // FIX: Création d'un objet Input propre conforme au Type System Elite
            const finalData: ProductCreateInput = {
                name: formState.name || '',
                price: safeNumber(formState.price),
                purchasePrice: safeNumber(formState.purchasePrice),
                quantity: safeNumber(formState.quantity),
                minStockLevel: safeNumber(formState.minStockLevel),
                unit: formState.unit as Product['unit'],
                category: formState.category,
                barcodes: formState.barcodes,
                dateExpiration: formState.dateExpiration,
                supplierUuid: formState.supplierUuid
            };

            if (product) await productService.updateProduct(product.uuid, finalData);
            else await productService.addProduct(finalData);
            
            toast.success(`Fiche produit synchronisée.`);
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const p = safeNumber(formState.price);
        const cost = safeNumber(formState.purchasePrice);
        if (p < cost && p > 0) setShowPriceConfirm(true);
        else await proceedWithSubmit();
    };

    const onInputFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

    useKeyboardShortcuts([
        {
            key: 'Enter',
            ctrl: true,
            action: () => handleSubmit(),
            description: 'Enregistrer le produit',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer la fenêtre',
            ignoreInputFocus: true
        }
    ], 'Produit', isOpen);

    const SectionTitle = ({ title, icon: Icon }: { title: string, icon: React.ElementType }) => (
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shadow-inner">
                <Icon className="h-3 w-3" />
            </div>
            <h4 className="text-[10px] font-semibold uppercase text-muted-foreground opacity-60 tracking-widest">{title}</h4>
        </div>
    );

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl rounded-lg border-none shadow-sm p-0 overflow-hidden bg-card">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="bg-primary/5 p-4 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                                <Package className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold tracking-tight">{product ? 'Édition Elite' : 'Nouveau Produit Elite'}</DialogTitle>
                                <DialogDescription className="font-medium">Paramétrage technique de la fiche produit Premium.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-xs font-bold border border-destructive/20 text-center">{error}</div>}
                        
                        <div>
                            <SectionTitle title="Identité & Détails" icon={FileText} />
                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ml-1">Désignation *</Label>
                                    <Input id="name" value={formState.name} onChange={handleInputChange} onFocus={onInputFocus} className="h-9 rounded-2xl bg-muted/20 border-none shadow-inner text-lg font-semibold tracking-tight focus-visible:ring-primary/20" placeholder="Ex: Grand Cru Espresso" required />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ml-1">Unité</Label>
                                        <Select value={formState.unit} onValueChange={(value) => setFormState(s => ({ ...s, unit: value as any }))}>
                                            <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none shadow-inner font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-2xl shadow-sm border-white/5">{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ml-1">Partenaire Fournisseur</Label>
                                        <Popover open={supplierPopoverOpen} onOpenChange={setSupplierPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between h-12 rounded-xl bg-muted/20 border-none shadow-inner font-bold text-xs">
                                                    <Building className="mr-2 h-3.5 w-3.5 opacity-30" />
                                                    {formState.supplierName || "Choisir un fournisseur..."}
                                                    <ChevronsUpDown className="ml-auto h-4 w-4 opacity-30" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl shadow-sm border-white/5 overflow-hidden">
                                                <Command>
                                                    <CommandInput placeholder="Chercher..." onValueChange={setSupplierSearch} />
                                                    <CommandList>
                                                        <CommandEmpty><Button variant="link" className="text-xs" onClick={() => { setFormState(p => ({...p, supplierName: supplierSearch, supplierUuid: undefined})); setSupplierPopoverOpen(false); }}>Créer "{supplierSearch}"</Button></CommandEmpty>
                                                        <CommandGroup>{suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())).map(s => <CommandItem key={s.uuid} value={s.name} onSelect={() => handleSupplierSelect(s.uuid)} className="font-bold">{s.name}</CommandItem>)}</CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionTitle title="Tarification & Marges" icon={Coins} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <div className="space-y-3">
                                    <Label htmlFor="purchasePrice" className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground opacity-60 ml-1">P.U Achat (TTC)</Label>
                                    <div className="relative">
                                        <Input id="purchasePrice" type="number" step="0.01" value={formState.purchasePrice ?? ''} onChange={handleInputChange} onFocus={onInputFocus} className="h-9 rounded-2xl bg-background border-none shadow-inner font-mono font-semibold text-lg px-8" required />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 font-semibold text-[10px] opacity-20 uppercase tracking-wide">DA</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="price" className="text-[10px] font-semibold uppercase tracking-wide text-primary ml-1">P.U Vente (Public)</Label>
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-primary/20 blur-lg rounded-2xl opacity-20"></div>
                                        <Input id="price" type="number" step="0.01" value={formState.price ?? ''} onChange={handleInputChange} onFocus={onInputFocus} className="relative h-9 rounded-2xl bg-background border-none shadow-inner font-mono font-semibold text-xl text-primary px-8" required />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 font-semibold text-[10px] text-primary opacity-40 uppercase tracking-wide">DA</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionTitle title="Gestion des Stocks" icon={Box} />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity" className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ml-1">Stock Actuel</Label>
                                    <Input id="quantity" type="number" step="0.001" value={formState.quantity ?? ''} onChange={handleInputChange} onFocus={onInputFocus} className="h-12 rounded-xl bg-muted/20 border-none shadow-inner font-semibold px-6" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minStockLevel" className="text-[10px] font-semibold uppercase tracking-wide text-amber-600/70 ml-1">Seuil d'Alerte</Label>
                                    <Input id="minStockLevel" type="number" value={formState.minStockLevel ?? ''} onChange={handleInputChange} onFocus={onInputFocus} className="h-12 rounded-xl bg-muted/20 border-none shadow-inner font-semibold text-amber-600 px-6" required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ml-1">Expiration</Label>
                                    <DatePicker date={formState.dateExpiration} setDate={(date) => setFormState(s => ({...s, dateExpiration: date }))}/>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-muted/10 rounded-lg border border-dashed border-white/5 space-y-4">
                            <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 ml-1">Traçabilité (Codes-barres)</Label>
                            <div className="flex gap-3">
                                <div className="relative flex-grow">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                                    <Input value={currentBarcode} onChange={(e) => setCurrentBarcode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBarcode(); } }} className="pl-11 h-12 rounded-xl bg-background border-none shadow-sm" placeholder="Scanner ou taper..." />
                                </div>
                                <button type="button" onClick={handleAddBarcode} className="h-12 w-12 rounded-xl border border-primary/20 bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"><Plus className="h-5 w-5" /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formState.barcodes?.map(b => (
                                    <Badge key={b} variant="secondary" className="pl-4 pr-2 py-2 rounded-xl bg-background border-white/5 shadow-sm font-mono text-[10px] font-semibold tracking-tighter">
                                        {b} <button type="button" onClick={() => handleRemoveBarcode(b)} className="ml-3 p-1 rounded-lg hover:bg-destructive/10 text-destructive/40 hover:text-destructive"><X className="h-3 w-3" /></button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-card border-t border-white/5 flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-9 rounded-2xl font-semibold text-xs uppercase tracking-wide px-8" disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading} className="flex-1 h-9 rounded-2xl font-semibold text-xs uppercase tracking-wide shadow-xl shadow-sm transition-all active:scale-95 gap-3">
                             {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                            {product ? 'Sauvegarder [Ctrl+Enter]' : 'Confirmer [Ctrl+Enter]'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <AlertDialog open={showPriceConfirm} onOpenChange={setShowPriceConfirm}>
            <AlertDialogContent className="rounded-lg border-none shadow-sm bg-card">
                <AlertDialogHeader>
                    <div className="flex items-center gap-4 mb-4 text-destructive">
                        <div className="p-4 rounded-2xl bg-destructive/10"><AlertTriangle className="h-8 w-8" /></div>
                        <AlertDialogTitle className="text-lg font-semibold tracking-tighter uppercase">Vente à perte détectée</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base font-medium leading-relaxed">
                        Le prix de vente (<b>{formatCurrency(formState.price || 0)}</b>) est inférieur au coût d'achat (<b>{formatCurrency(formState.purchasePrice || 0)}</b>). Souhaitez-vous vraiment confirmer cette tarification ?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3 mt-6">
                    <AlertDialogCancel className="h-9 rounded-2xl font-bold border-none bg-muted/20">Réviser</AlertDialogCancel>
                    <AlertDialogAction onClick={proceedWithSubmit} className="h-9 rounded-2xl font-semibold bg-destructive hover:bg-destructive/90 shadow-lg shadow-sm">Confirmer Vente à Perte</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
