'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, ShoppingBag, Truck, Building, Hash, Loader2, PackagePlus, Calculator, Coins, Sparkles, BadgePercent, AlertTriangle, ScanLine } from 'lucide-react';
import { ProductIntakeCombobox } from './ProductIntakeCombobox';
import { OcrInvoiceScanner } from './OcrInvoiceScanner';
import type { Product, StockIntakeItem } from '@/lib/types';
import { formatCurrency, cn, safeNumber, preciseMultiply } from '@/lib/utils';
import { useAppActions } from '@/stores/appStore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { DatePicker } from '../ui/date-picker';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function NewIntakeForm() {
    const router = useRouter();
    const { processStockIntake } = useAppActions();

    const [supplierName, setSupplierName] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [items, setItems] = useState<StockIntakeItem[]>([]);
    const [isSubmitting, setIsSaving] = useState(false);

    /**
     * Moteur de calcul de la valeur totale en centimes pour une précision absolue
     * et éviter toute perte lors de la répartition des frais de transport.
     */
    const itemsTotalValue = useMemo(() => {
        const totalCents = items.reduce((sum, item) => {
            const qty = safeNumber(item.quantity);
            const cost = safeNumber(item.purchasePrice);
            return sum + Math.round(preciseMultiply(qty, cost) * 100);
        }, 0);
        return totalCents / 100;
    }, [items]);

    /**
     * Facteur de transport : pourcentage des frais additionnels à imputer sur chaque unité monétaire d'achat.
     */
    const shippingFactor = useMemo(() => {
        return itemsTotalValue > 0 ? shippingCost / itemsTotalValue : 0;
    }, [itemsTotalValue, shippingCost]);

    const totalValue = itemsTotalValue + shippingCost;

    const handleAddProduct = (product: Product) => {
        const existing = items.find(i => i.productUuid === product.uuid);
        if (existing) {
            toast.info(`"${product.name}" est déjà dans le manifeste.`, {
                description: "Modifiez la quantité directement dans le tableau."
            });
            return;
        }

        const newItem: StockIntakeItem = {
            id: uuidv4(),
            productUuid: product.uuid,
            name: product.name,
            barcodes: product.barcodes || [],
            quantity: 1,
            quantityDamaged: 0,
            purchasePrice: product.purchasePrice || 0,
            price: product.price,
            unite: product.unite || 'Pièce',
            isNew: false
        };
        setItems(prev => [newItem, ...prev]);
    };

    const handleCreateNewProduct = (name: string) => {
        const newItem: StockIntakeItem = {
            id: uuidv4(),
            name: name.trim(),
            barcodes: [],
            quantity: 1,
            quantityDamaged: 0,
            purchasePrice: 0,
            price: 0,
            unite: 'Pièce',
            isNew: true
        };
        setItems(prev => [newItem, ...prev]);
    };

    const updateItem = (id: string, field: keyof StockIntakeItem, value: string | number | boolean | string[]) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                return updated;
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleOcrResult = useCallback((result: { rawText: string, lines: string[] }) => {
        // 1. Détection du numéro de facture (Patterns: N°, Facture, Ref...)
        const invMatch = result.rawText.match(/(?:N°|Facture|Ref|Invoice|Nº)[:\s]*([A-Z0-9-]+)/i);
        if (invMatch && invMatch[1]) {
            setInvoiceNumber(invMatch[1]);
        }

        // 2. Détection de la date
        const dateMatch = result.rawText.match(/(\d{2}[/-]\d{2}[/-]\d{2,4})/);
        if (dateMatch) {
            const parsedDate = new Date(dateMatch[0].replace(/-/g, '/'));
            if (!isNaN(parsedDate.getTime())) {
                setInvoiceDate(parsedDate);
            }
        }

        // 3. Heuristique pour le fournisseur (souvent sur la première ou deuxième ligne)
        if (result.lines.length > 0 && !supplierName) {
            // On ignore les lignes trop courtes ou purement numériques
            const potentialName = result.lines.find(l => l.length > 3 && !/^\d+$/.test(l));
            if (potentialName) setSupplierName(potentialName);
        }

        toast.success("Analyse OCR terminée", {
            description: "Les informations détectées ont été pré-remplies."
        });
    }, [supplierName]);

    const handleSave = async () => {
        if (!supplierName.trim()) {
            toast.error("Veuillez identifier le partenaire fournisseur.");
            return;
        }
        if (items.length === 0) {
            toast.error("Le manifeste de flux est vide.");
            return;
        }
        
        const invalidItems = items.filter(i => safeNumber(i.quantity) <= 0);
        if (invalidItems.length > 0) {
            toast.error(`Données invalides : ${invalidItems.length} article(s) ont des quantités nulles.`);
            return;
        }

        setIsSaving(true);
        try {
            const success = await processStockIntake({
                supplierName: supplierName.trim(),
                invoiceNumber: invoiceNumber.trim() || `ELITE-${Date.now().toString().slice(-6)}`,
                invoiceDate: invoiceDate || new Date(),
                shippingCost,
                items,
                totalValue
            });

            if (success) {
                toast.success("Manifeste validé. Stock et comptes mis à jour.");
                router.push('/stock');
            }
        } catch (error: any) {
            toast.error("Échec critique de validation.");
        } finally {
            setIsSaving(false);
        }
    };

    useKeyboardShortcuts([
        {
            key: 'Enter',
            ctrl: true,
            action: handleSave,
            description: 'Valider le manifeste de réception',
            ignoreInputFocus: true
        }
    ], 'Logistique', items.length > 0);

    return (
        <div className="grid lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="lg:col-span-9 space-y-6">
                <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-black tracking-tighter uppercase">Manifeste de Flux Entrants</CardTitle>
                        </div>
                        <div className="max-w-md flex-grow">
                            <ProductIntakeCombobox 
                                onProductSelected={handleAddProduct}
                                onNewProductCreated={handleCreateNewProduct}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-black/20 border-none">
                                    <TableRow className="border-white/5">
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 p-4">Désignation Produit</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 text-center">Qté Flux</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 text-right">P. Achat HT</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-primary/60 text-right">C. Revient</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-emerald-500/60 text-right">Prix Public</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 text-right">Marge</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 text-right">Total HT</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-96 text-center p-6 opacity-20">
                                                <div className="flex flex-col items-center justify-center gap-6">
                                                    <div className="p-8 rounded-3xl bg-muted/20 border-2 border-dashed border-white/10">
                                                        <PackagePlus className="h-16 w-16" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Scanner ou rechercher des produits pour remplir le manifeste</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item) => {
                                            const qty = safeNumber(item.quantity);
                                            const cost = safeNumber(item.purchasePrice);
                                            const landingCost = cost * (1 + shippingFactor);
                                            const rowTotal = preciseMultiply(qty, cost);
                                            const isSellingAtLoss = item.price < landingCost && item.price > 0;
                                            const margin = item.price > 0 ? ((item.price - landingCost) / item.price) * 100 : 0;
                                            
                                            return (
                                                <TableRow key={item.id} className="border-white/5 group hover:bg-white/5 transition-all">
                                                    <TableCell className="p-4">
                                                        <div className="flex flex-col gap-1 min-w-[200px]">
                                                            <span className="font-black text-sm tracking-tight truncate">{item.name}</span>
                                                            {item.isNew && (
                                                                <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-lg w-fit border border-primary/20 tracking-tighter">Nouveau Produit</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-4">
                                                        <Input 
                                                            type="number" 
                                                            step="0.001"
                                                            value={item.quantity} 
                                                            onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                                                            onFocus={e => e.target.select()}
                                                            className="w-20 h-9 text-center bg-black/20 border-none shadow-inner mx-auto font-black text-lg focus-visible:ring-primary/20"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right">
                                                        <div className="relative group/price">
                                                            <Input 
                                                                type="number" 
                                                                step="0.01"
                                                                value={item.purchasePrice || ''} 
                                                                onChange={e => updateItem(item.id, 'purchasePrice', e.target.value)}
                                                                onFocus={e => e.target.select()}
                                                                className={cn(
                                                                    "w-24 h-9 text-right bg-black/20 border-none shadow-inner font-mono font-black ml-auto focus-visible:ring-primary/20 pr-6",
                                                                    cost <= 0 && "text-destructive animate-pulse"
                                                                )}
                                                                placeholder="0.00"
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold opacity-20">DA</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-mono text-xs font-black text-primary tracking-tighter">{landingCost.toFixed(2)}</span>
                                                            <div className="flex items-center gap-1 text-[7px] text-muted-foreground/30 font-black uppercase tracking-tighter">
                                                                <BadgePercent className="h-2 w-2" /> AMORTI
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right">
                                                        <div className="relative group/sale-price">
                                                            <Input 
                                                                type="number" 
                                                                step="0.01"
                                                                value={item.price || ''} 
                                                                onChange={e => updateItem(item.id, 'price', e.target.value)}
                                                                onFocus={e => e.target.select()}
                                                                className={cn(
                                                                    "w-24 h-9 text-right bg-black/20 border-none shadow-inner font-mono font-black ml-auto focus-visible:ring-primary/20 pr-6",
                                                                    isSellingAtLoss ? "text-destructive" : "text-emerald-500"
                                                                )}
                                                                placeholder="0.00"
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold opacity-20">DA</span>
                                                            {isSellingAtLoss && <AlertTriangle className="absolute -left-5 top-1/2 -translate-y-1/2 h-3 w-3 text-destructive animate-pulse" />}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right">
                                                        <span className={cn(
                                                            "text-[10px] font-black tabular-nums",
                                                            margin < 0 ? "text-destructive" : margin < 15 ? "text-amber-500" : "text-emerald-500"
                                                        )}>
                                                            {margin.toFixed(1)}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right font-mono font-black text-sm tracking-tighter tabular-nums">
                                                        {formatCurrency(rowTotal)}
                                                    </TableCell>
                                                    <TableCell className="p-4 text-center">
                                                        <button 
                                                            onClick={() => removeItem(item.id)} 
                                                            className="text-destructive/20 hover:text-destructive transition-all hover:scale-125 active:scale-90"
                                                            title="Révoquer ligne"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-3 space-y-6">
                <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden sticky top-24 shadow-xl">
                    <CardHeader className="bg-primary/5 border-b border-white/5 p-4">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5" /> Synthèse Logistique
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {/* OCR Scanner Section */}
                        <div className="p-4 bg-primary/5 rounded-2xl border border-dashed border-primary/20 space-y-3">
                            <div className="flex items-center gap-2 text-primary">
                                <ScanLine className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Saisie par OCR AI</span>
                            </div>
                            <OcrInvoiceScanner onResult={handleOcrResult} disabled={isSubmitting} />
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground/60 ml-1 tracking-widest">Établissement Fournisseur *</Label>
                                <div className="relative group">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-20 group-focus-within:text-primary transition-all duration-500" />
                                    <Input 
                                        placeholder="Identification source..." 
                                        className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-black focus-visible:ring-primary/20"
                                        value={supplierName}
                                        onChange={e => setSupplierName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 p-4 bg-muted/20 rounded-2xl border border-white/5 shadow-inner">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground/40 ml-1 tracking-widest">Réf. Facture / BL</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20" />
                                        <Input 
                                            placeholder="N° FAC..." 
                                            className="pl-9 h-10 rounded-lg bg-black/20 border-none shadow-inner font-mono font-bold"
                                            value={invoiceNumber}
                                            onChange={e => setInvoiceNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground/40 ml-1 tracking-widest">Date de Flux</Label>
                                    <DatePicker date={invoiceDate} setDate={setInvoiceDate} />
                                </div>
                            </div>

                            <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-4 shadow-inner relative overflow-hidden group/shipping">
                                <Truck className="absolute -right-4 -top-4 h-20 w-20 opacity-[0.03] group-hover/shipping:opacity-10 transition-opacity" />
                                <div className="flex items-center justify-between relative z-10">
                                    <Label className="text-[10px] font-black uppercase text-primary/60 flex items-center gap-2">
                                        <Truck className="h-3.5 w-3.5" /> Transport & Logistique
                                    </Label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            step="0.01"
                                            value={shippingCost || ''} 
                                            onChange={e => setShippingCost(safeNumber(e.target.value))}
                                            onFocus={e => e.target.select()}
                                            className="w-24 h-9 text-right rounded-lg bg-black/20 border-none shadow-inner font-mono font-black"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold opacity-20">DA</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 space-y-4">
                            <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground/40 tracking-widest">
                                <span>Valorisation Marchande</span>
                                <span className="font-mono text-foreground font-black tabular-nums">{formatCurrency(itemsTotalValue)}</span>
                            </div>
                            <div className="flex justify-between items-end pt-6 bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Solde Dû Partenaire</span>
                                    <span className="text-[8px] font-bold text-muted-foreground/30">Total Net à Payer</span>
                                </div>
                                <span className="text-3xl font-black text-primary tracking-tighter tabular-nums">{formatCurrency(totalValue)}</span>
                            </div>
                        </div>

                        <div className="pt-8">
                            <div className="relative group">
                                <div className="absolute -inset-1.5 bg-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-10 transition duration-700"></div>
                                <Button 
                                    onClick={handleSave} 
                                    disabled={isSubmitting || items.length === 0}
                                    className="relative w-full h-16 rounded-2xl font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-[0.98] gap-3"
                                >
                                    {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                                    Valider Manifeste [Enter]
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <div className="p-4 bg-muted/5 text-center">
                        <p className="text-[8px] font-black uppercase text-muted-foreground/30 flex items-center justify-center gap-2">
                             <Calculator className="h-2.5 w-2.5" /> Précision Élite v2.9 Actif
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
