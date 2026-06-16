
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
import { ocrParserService } from '@/services/ocr-parser.service';

export function NewIntakeForm() {
    const router = useRouter();
    const { processStockIntake } = useAppActions();

    const [supplierName, setSupplierName] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [items, setItems] = useState<StockIntakeItem[]>([]);
    const [isSubmitting, setIsSaving] = useState(false);

    const itemsTotalValue = useMemo(() => {
        const totalCents = items.reduce((sum, item) => {
            const qty = safeNumber(item.quantity);
            const cost = safeNumber(item.purchasePrice);
            return sum + Math.round(preciseMultiply(qty, cost) * 100);
        }, 0);
        return totalCents / 100;
    }, [items]);

    const shippingFactor = useMemo(() => {
        return itemsTotalValue > 0 ? shippingCost / itemsTotalValue : 0;
    }, [itemsTotalValue, shippingCost]);

    const totalValue = itemsTotalValue + shippingCost;

    const handleAddProduct = (product: Product) => {
        const existing = items.find(i => i.productUuid === product.uuid);
        if (existing) {
            toast.info(`"${product.name}" est déjà dans le manifeste.`);
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
            unit: product.unit || 'Pièce',
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
            unit: 'Pièce',
            isNew: true
        };
        setItems(prev => [newItem, ...prev]);
    };

    const updateItem = (id: string, field: keyof StockIntakeItem, value: any) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleOcrResult = useCallback(async (result: { rawText: string, lines: string[] }) => {
        // Extraction de l'entête
        const invMatch = result.rawText.match(/(?:N°|Facture|Ref|Invoice|Nº)[:\s]*([A-Z0-9-]+)/i);
        if (invMatch && invMatch[1]) setInvoiceNumber(invMatch[1]);

        // Extraction des produits structurés via le nouveau service
        const parsedItems = await ocrParserService.parseInvoiceLines(result.lines);
        
        if (parsedItems.length > 0) {
            const newIntakeItems: StockIntakeItem[] = parsedItems.map(p => ({
                id: uuidv4(),
                ...p,
                barcodes: [],
                quantityDamaged: 0,
                unit: 'Pièce'
            }));
            setItems(prev => [...newIntakeItems, ...prev]);
            toast.success(`${parsedItems.length} articles importés du scan.`);
        }
    }, []);

    const handleSave = async () => {
        if (!supplierName.trim()) { toast.error("Identifiez le fournisseur."); return; }
        if (items.length === 0) { toast.error("Manifeste vide."); return; }
        
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
                toast.success("Réception validée.");
                router.push('/stock');
            }
        } catch (error: any) {
            toast.error("Erreur de validation.");
        } finally {
            setIsSaving(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'Enter', ctrl: true, action: handleSave, description: 'Valider le manifeste', ignoreInputFocus: true }
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
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 p-4">Produit</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 text-center">Qté</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 text-right">Achat HT</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-primary/60 text-right">C. Revient</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-emerald-500/60 text-right">Marge</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 text-right">Total HT</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-80 text-center p-6 opacity-20">
                                                <div className="flex flex-col items-center justify-center gap-6">
                                                    <PackagePlus className="h-16 w-16" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Scannez ou ajoutez des produits</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item) => {
                                            const qty = safeNumber(item.quantity);
                                            const cost = safeNumber(item.purchasePrice);
                                            const landingCost = cost * (1 + shippingFactor);
                                            const rowTotal = preciseMultiply(qty, cost);
                                            const margin = item.price > 0 ? ((item.price - landingCost) / item.price) * 100 : 0;
                                            
                                            return (
                                                <TableRow key={item.id} className="border-white/5 group hover:bg-white/5 transition-all">
                                                    <TableCell className="p-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-black text-sm">{item.name}</span>
                                                            {item.isNew && <span className="text-[8px] font-black text-primary uppercase">Nouveau</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-4">
                                                        <Input 
                                                            type="number" 
                                                            value={item.quantity} 
                                                            onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                                                            className="w-20 h-9 text-center bg-black/20 border-none mx-auto font-black"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right">
                                                        <Input 
                                                            type="number" 
                                                            value={item.purchasePrice || ''} 
                                                            onChange={e => updateItem(item.id, 'purchasePrice', e.target.value)}
                                                            className="w-24 h-9 text-right bg-black/20 border-none font-mono font-black ml-auto"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right">
                                                        <span className="font-mono text-xs font-black text-primary">{landingCost.toFixed(2)}</span>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right">
                                                        <span className={cn("text-[10px] font-black", margin < 0 ? "text-destructive" : "text-emerald-500")}>
                                                            {margin.toFixed(1)}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right font-mono font-black text-sm">
                                                        {formatCurrency(rowTotal)}
                                                    </TableCell>
                                                    <TableCell className="p-4 text-center">
                                                        <button onClick={() => removeItem(item.id)} className="text-destructive/20 hover:text-destructive transition-all">
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
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Audit de Réception</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <OcrInvoiceScanner onResult={handleOcrResult} disabled={isSubmitting} />

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Fournisseur *</Label>
                                <Input 
                                    placeholder="Nom du fournisseur..." 
                                    className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-black"
                                    value={supplierName}
                                    onChange={e => setSupplierName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Réf. Facture</Label>
                                <Input 
                                    placeholder="N° FAC..." 
                                    className="h-10 rounded-lg bg-black/20 border-none font-mono"
                                    value={invoiceNumber}
                                    onChange={e => setInvoiceNumber(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Frais Logistique</Label>
                                <Input 
                                    type="number" 
                                    value={shippingCost || ''} 
                                    onChange={e => setShippingCost(safeNumber(e.target.value))}
                                    className="h-10 rounded-lg bg-black/20 border-none text-right font-mono"
                                />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <div className="flex justify-between items-end pt-6 bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-primary">Total Net</span>
                                </div>
                                <span className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(totalValue)}</span>
                            </div>
                        </div>

                        <Button 
                            onClick={handleSave} 
                            disabled={isSubmitting || items.length === 0}
                            className="w-full h-16 rounded-2xl font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 gap-3"
                        >
                            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                            Valider
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
