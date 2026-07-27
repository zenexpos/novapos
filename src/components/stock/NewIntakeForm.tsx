'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Save, ShoppingBag, Hash, Loader2, Plus } from 'lucide-react';
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

    useKeyboardShortcuts([{ key: 'Enter', ctrl: true, action: handleSave, description: 'Valider', ignoreInputFocus: true }], 'Logistique');

    return (
        <div className="grid lg:grid-cols-12 gap-1 animate-in fade-in duration-300">
            <div className="lg:col-span-9 space-y-1">
                <Card className="rounded-xl border border-border/40 bg-card/30 overflow-hidden shadow-none">
                    <CardHeader className="bg-muted/10 border-b p-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="max-w-xl flex-grow">
                            <ProductIntakeCombobox 
                                onProductSelected={handleAddProduct}
                                onNewProductCreated={handleCreateNewProduct}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/5 border-none">
                                    <TableRow className="h-7 border-b border-border/40">
                                        <TableHead className="text-[8px] font-black uppercase text-muted-foreground/40 px-2 tracking-[0.1em]">Désignation</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-muted-foreground/40 text-center px-1 tracking-[0.1em]">Qté</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-muted-foreground/40 text-right px-1 tracking-[0.1em]">Achat</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-primary/40 text-right px-1 tracking-[0.1em]">Vente</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-muted-foreground/40 text-right px-1 tracking-[0.1em]">Revient</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-emerald-500/40 text-right px-1 tracking-[0.1em]">Marge</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-muted-foreground/40 text-right px-2 tracking-[0.1em]">Total</TableHead>
                                        <TableHead className="w-7"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-40 text-center opacity-10 text-[9px] font-black uppercase tracking-[0.3em]">Zone de saisie libre</TableCell>
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
                                                <TableRow key={item.id} className={cn("group hover:bg-white/5 transition-all border-b border-border/20 h-8", landingCost > sellPrice && sellPrice > 0 && "bg-destructive/5")}>
                                                    <TableCell className="px-2 py-0">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-[11px] uppercase truncate max-w-[280px]">{item.name}</span>
                                                            {item.isNew && <span className="text-[7px] font-black text-primary uppercase">Nouveau</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0">
                                                        <input 
                                                            type="number" 
                                                            value={item.quantity} 
                                                            onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                                                            className="w-14 h-6 text-center bg-black/10 border-none rounded font-bold text-[10px] outline-none focus:ring-1 focus:ring-primary/40 tabular-nums"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0 text-right">
                                                        <input 
                                                            type="number" 
                                                            value={item.purchasePrice || ''} 
                                                            onChange={e => updateItem(item.id, 'purchasePrice', e.target.value)}
                                                            className="w-16 h-6 text-right bg-black/10 border-none rounded font-mono font-bold text-[10px] outline-none focus:ring-1 focus:ring-primary/40 tabular-nums"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0 text-right">
                                                        <input 
                                                            type="number" 
                                                            value={item.price || ''} 
                                                            onChange={e => updateItem(item.id, 'price', e.target.value)}
                                                            className="w-16 h-6 text-right bg-primary/5 border border-primary/20 rounded font-mono font-bold text-[10px] text-primary outline-none focus:ring-1 focus:ring-primary/50 tabular-nums"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0 text-right">
                                                        <span className="font-mono text-[9px] font-bold text-muted-foreground/30">{landingCost.toFixed(2)}</span>
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0 text-right">
                                                        <span className={cn("text-[9px] font-black tabular-nums", margin < 0 ? "text-destructive" : "text-emerald-500/60")}>
                                                            {margin.toFixed(0)}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-2 py-0 text-right font-mono font-black text-[11px] tracking-tighter text-foreground/80 tabular-nums">
                                                        {formatCurrency(rowTotal)}
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0 text-center">
                                                        <button onClick={() => removeItem(item.id)} className="text-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100">
                                                            <Trash2 className="h-3 w-3" />
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

            <div className="lg:col-span-3 space-y-1">
                <Card className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md shadow-none sticky top-20">
                    <CardContent className="p-3 space-y-3">
                        <OcrInvoiceScanner onResult={handleOcrResult} disabled={isSubmitting} />

                        <div className="space-y-2">
                            <div className="space-y-0.5">
                                <Label className="text-[8px] font-black uppercase opacity-30 ml-1">Mvrd / Fournisseur</Label>
                                <Input 
                                    placeholder="Identité..." 
                                    className="h-8 rounded-lg bg-black/10 border-none font-bold text-[11px] uppercase"
                                    value={supplierName}
                                    onChange={e => setSupplierName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                    <Label className="text-[8px] font-black uppercase opacity-30 ml-1">Facture N°</Label>
                                    <Input 
                                        placeholder="REF..." 
                                        className="h-8 rounded-lg bg-black/10 border-none font-mono text-[10px]"
                                        value={invoiceNumber}
                                        onChange={e => setInvoiceNumber(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <Label className="text-[8px] font-black uppercase opacity-30 ml-1">Trans. (DA)</Label>
                                    <Input 
                                        type="number" 
                                        value={shippingCost || ''} 
                                        onChange={e => setShippingCost(safeNumber(e.target.value))}
                                        className="h-8 rounded-lg bg-black/10 border-none text-right font-mono text-[10px] font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-white/5">
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex justify-between items-center shadow-inner">
                                <span className="text-[8px] font-black uppercase text-primary tracking-widest">Invest. Net</span>
                                <span className="text-lg font-black text-primary tabular-nums tracking-tighter">{formatCurrency(totalValue)}</span>
                            </div>
                        </div>

                        <Button 
                            onClick={handleSave} 
                            disabled={isSubmitting || items.length === 0}
                            className="w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 gap-2"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Valider [Enter]
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
