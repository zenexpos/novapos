'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, ShoppingBag, Truck, Hash, Loader2, PackagePlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ProductIntakeCombobox } from './ProductIntakeCombobox';
import { OcrInvoiceScanner } from './OcrInvoiceScanner';
import type { Product, StockIntakeItem } from '@/lib/types';
import { formatCurrency, cn, safeNumber, preciseMultiply, roundFinancial } from '@/lib/utils';
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
        return items.reduce((sum, item) => {
            return sum + Math.round(preciseMultiply(safeNumber(item.quantity), safeNumber(item.purchasePrice)) * 100);
        }, 0) / 100;
    }, [items]);

    const shippingFactor = useMemo(() => {
        return itemsTotalValue > 0 ? shippingCost / itemsTotalValue : 0;
    }, [itemsTotalValue, shippingCost]);

    const totalValue = itemsTotalValue + shippingCost;

    const handleAddProduct = useCallback((product: Product) => {
        const existing = items.find(i => i.productUuid === product.uuid);
        if (existing) {
            toast.info(`"${product.name}" déjà présent.`);
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
    }, [items]);

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
        const detectedSupplier = ocrParserService.detectSupplier(result.rawText);
        if (detectedSupplier) setSupplierName(detectedSupplier);

        const invMatch = result.rawText.match(/(?:N°|Facture|Ref|Invoice|Nº)[:\s]*([A-Z0-9-]+)/i);
        if (invMatch && invMatch[1]) setInvoiceNumber(invMatch[1]);

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
            toast.success(`${parsedItems.length} articles extraits.`);
        }
    }, []);

    const handleSave = async () => {
        if (!supplierName.trim()) { toast.error("Veuillez renseigner le fournisseur."); return; }
        if (items.length === 0) { toast.error("La liste est vide."); return; }
        setIsSaving(true);
        try {
            const success = await processStockIntake({
                supplierName: supplierName.trim(),
                invoiceNumber: invoiceNumber.trim() || `INT-${Date.now().toString().slice(-6)}`,
                invoiceDate: invoiceDate || new Date(),
                shippingCost,
                items,
                totalValue
            });
            if (success) {
                toast.success("Stock mis à jour.");
                router.push('/stock');
            }
        } catch (error: any) {
            toast.error("Échec du traitement.");
        } finally {
            setIsSaving(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'Enter', ctrl: true, action: handleSave, description: 'Valider', ignoreInputFocus: true }
    ], 'Logistique');

    return (
        <div className="grid lg:grid-cols-12 gap-2 animate-in fade-in duration-500 pb-20">
            <div className="lg:col-span-9 space-y-2">
                <Card className="rounded-xl border bg-card/50 overflow-hidden shadow-sm">
                    <CardHeader className="bg-muted/30 border-b p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Réception Articles</CardTitle>
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
                                <TableHeader className="bg-black/10 border-none">
                                    <TableRow className="h-8 border-b">
                                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/60 px-3">Désignation</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/60 text-center px-2">Qté</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/60 text-right px-2">Achat</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-primary/60 text-right px-2">Vente</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/60 text-right px-2">Revient</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-emerald-500/60 text-right px-2">Marge</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/60 text-right px-3">Total</TableHead>
                                        <TableHead className="w-8"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-40 text-center p-6 opacity-20 text-[10px] font-bold uppercase tracking-widest">
                                                Aucun produit dans la liste
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item) => {
                                            const qty = safeNumber(item.quantity);
                                            const cost = safeNumber(item.purchasePrice);
                                            const sellPrice = safeNumber(item.price);
                                            const landingCost = cost * (1 + shippingFactor);
                                            const rowTotal = preciseMultiply(qty, cost);
                                            const margin = sellPrice > 0 ? ((sellPrice - landingCost) / sellPrice) * 100 : 0;
                                            
                                            return (
                                                <TableRow key={item.id} className={cn("group transition-all h-10", landingCost > sellPrice && sellPrice > 0 && "bg-destructive/5")}>
                                                    <TableCell className="px-3 py-1">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs uppercase truncate max-w-[250px]">{item.name}</span>
                                                            {item.isNew && <span className="text-[7px] font-black text-primary uppercase">Nouveau</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-2 py-1">
                                                        <input 
                                                            type="number" 
                                                            value={item.quantity} 
                                                            onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                                                            className="w-16 h-7 text-center bg-black/5 border rounded font-bold text-xs outline-none focus:ring-1 focus:ring-primary/30"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2 py-1 text-right">
                                                        <input 
                                                            type="number" 
                                                            value={item.purchasePrice || ''} 
                                                            onChange={e => updateItem(item.id, 'purchasePrice', e.target.value)}
                                                            className="w-20 h-7 text-right bg-black/5 border rounded font-mono font-bold text-xs outline-none focus:ring-1 focus:ring-primary/30"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2 py-1 text-right">
                                                        <input 
                                                            type="number" 
                                                            value={item.price || ''} 
                                                            onChange={e => updateItem(item.id, 'price', e.target.value)}
                                                            className="w-20 h-7 text-right bg-primary/5 border border-primary/20 rounded font-mono font-bold text-xs text-primary outline-none focus:ring-1 focus:ring-primary/50"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2 py-1 text-right">
                                                        <span className="font-mono text-[10px] font-bold text-muted-foreground/60">{landingCost.toFixed(2)}</span>
                                                    </TableCell>
                                                    <TableCell className="px-2 py-1 text-right">
                                                        <span className={cn("text-[9px] font-black", margin < 0 ? "text-destructive" : "text-emerald-500")}>
                                                            {margin.toFixed(0)}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-3 py-1 text-right font-mono font-bold text-xs">
                                                        {formatCurrency(rowTotal)}
                                                    </TableCell>
                                                    <TableCell className="px-2 py-1 text-center">
                                                        <button onClick={() => removeItem(item.id)} className="text-destructive/20 hover:text-destructive transition-all">
                                                            <Trash2 className="h-3.5 w-3.5" />
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

            <div className="lg:col-span-3 space-y-2">
                <Card className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-xl sticky top-20">
                    <CardHeader className="bg-primary/5 border-b p-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary/60">Finalisation Réception</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <OcrInvoiceScanner onResult={handleOcrResult} disabled={isSubmitting} />

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Fournisseur *</Label>
                                <Input 
                                    placeholder="Nom..." 
                                    className="h-9 rounded-lg bg-black/10 border-none font-bold text-sm"
                                    value={supplierName}
                                    onChange={e => setSupplierName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase opacity-40 ml-1">N° Facture / BL</Label>
                                <Input 
                                    placeholder="Référence..." 
                                    className="h-9 rounded-lg bg-black/10 border-none font-mono text-sm"
                                    value={invoiceNumber}
                                    onChange={e => setInvoiceNumber(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Transport (DA)</Label>
                                <Input 
                                    type="number" 
                                    value={shippingCost || ''} 
                                    onChange={e => setShippingCost(safeNumber(e.target.value))}
                                    className="h-9 rounded-lg bg-black/10 border-none text-right font-mono"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <div className="bg-black/20 p-4 rounded-xl border flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase text-primary">Investissement</span>
                                <span className="text-xl font-black text-primary tabular-nums tracking-tighter">{formatCurrency(totalValue)}</span>
                            </div>
                        </div>

                        <Button 
                            onClick={handleSave} 
                            disabled={isSubmitting || items.length === 0}
                            className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 gap-2"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Confirmer [Entrée]
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
