'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Save, Loader2, Truck } from 'lucide-react';
import { ProductIntakeCombobox } from './ProductIntakeCombobox';
import { OcrInvoiceScanner } from './OcrInvoiceScanner';
import type { Product, StockIntakeItem, StockIntakeStoredItem } from '@/lib/types';
import { formatCurrency, cn, safeNumber, preciseMultiply, roundFinancial } from '@/lib/utils';
import { useAppActions } from '@/stores/appStore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
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
            toast.info(`"${product.name}" موجود بالجدول.`);
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
            toast.success(`${parsedItems.length} ITMS OK.`);
        }
    }, []);

    const handleSave = async () => {
        if (!supplierName.trim()) { toast.error("Mvrd requis."); return; }
        if (items.length === 0) { toast.error("Liste vide."); return; }
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
                toast.success("M.A.J Stock OK.");
                router.push('/stock');
            }
        } catch (error: any) {
            toast.error("Échec validation.");
        } finally {
            setIsSaving(false);
        }
    };

    useKeyboardShortcuts([{ key: 'Enter', ctrl: true, action: handleSave, description: 'Valider', ignoreInputFocus: true }], 'StockIntake');

    return (
        <div className="grid lg:grid-cols-12 gap-0.5 bg-border/20">
            <div className="lg:col-span-9 bg-card/40 rounded-lg overflow-hidden">
                <Card className="rounded-none border-none shadow-none bg-transparent">
                    <CardHeader className="bg-muted/10 border-b p-1">
                        <ProductIntakeCombobox 
                            onProductSelected={handleAddProduct}
                            onNewProductCreated={handleCreateNewProduct}
                        />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow className="h-6 border-b-border/40">
                                        <TableHead className="text-[8px] font-black uppercase text-muted-foreground/50 px-3">Désignation</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-muted-foreground/50 text-center px-1">Qté</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-muted-foreground/50 text-right px-1">Achat</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-primary/50 text-right px-1">Vente</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-muted-foreground/30 text-right px-1">Revient</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-emerald-500/40 text-right px-1">Marge</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-muted-foreground/50 text-right px-3">Ligne</TableHead>
                                        <TableHead className="w-8"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-48 text-center opacity-10 text-[9px] font-black uppercase tracking-[0.4em]">En attente de saisie</TableCell>
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
                                                <TableRow key={item.id} className="hover:bg-white/5 border-b border-border/10 h-8 transition-colors group">
                                                    <TableCell className="px-3 py-0">
                                                        <span className="font-bold text-[11px] uppercase truncate block max-w-[400px]">{item.name}</span>
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0">
                                                        <input 
                                                            type="number" 
                                                            value={item.quantity} 
                                                            onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                                                            className="w-14 h-6 text-center bg-black/20 border-none rounded text-[11px] font-black tabular-nums focus:ring-1 focus:ring-primary/40 outline-none shadow-inner"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0 text-right">
                                                        <input 
                                                            type="number" 
                                                            value={item.purchasePrice || ''} 
                                                            onChange={e => updateItem(item.id, 'purchasePrice', e.target.value)}
                                                            className="w-20 h-6 text-right bg-black/20 border-none rounded text-[11px] font-mono font-bold tabular-nums outline-none shadow-inner px-2"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0 text-right">
                                                        <input 
                                                            type="number" 
                                                            value={item.price || ''} 
                                                            onChange={e => updateItem(item.id, 'price', e.target.value)}
                                                            className="w-20 h-6 text-right bg-primary/5 border border-primary/10 rounded text-[11px] text-primary font-mono font-bold tabular-nums outline-none shadow-inner px-2"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0 text-right">
                                                        <span className="font-mono text-[9px] font-bold opacity-30 tabular-nums">{landingCost.toFixed(2)}</span>
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0 text-right">
                                                        <span className={cn("text-[10px] font-black tabular-nums", margin < 0 ? "text-destructive" : "text-emerald-500/50")}>
                                                            {margin.toFixed(0)}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-3 py-0 text-right font-mono font-black text-[11px] tabular-nums text-foreground/80">
                                                        {rowTotal.toFixed(0)}
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0 text-center">
                                                        <button onClick={() => removeItem(item.id)} className="text-destructive/20 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
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

            <div className="lg:col-span-3 space-y-1.5 p-1">
                <div className="sticky top-1.5 space-y-1.5">
                    <OcrInvoiceScanner onResult={handleOcrResult} disabled={isSubmitting} />

                    <div className="space-y-2 p-3 bg-black/20 rounded-xl border border-white/5 shadow-inner">
                        <div className="space-y-1">
                            <Label className="text-[8px] font-black uppercase opacity-40 ml-1">Mvrd / Source</Label>
                            <Input 
                                placeholder="Nom du fournisseur..." 
                                className="h-9 text-xs font-black uppercase bg-muted/20 border-none shadow-inner"
                                value={supplierName}
                                onChange={e => setSupplierName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[8px] font-black uppercase opacity-40 ml-1">Réf.</Label>
                                <Input 
                                    placeholder="N° Bon..." 
                                    className="h-9 text-[11px] font-mono font-bold bg-muted/20 border-none shadow-inner"
                                    value={invoiceNumber}
                                    onChange={e => setInvoiceNumber(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[8px] font-black uppercase text-primary/60 ml-1 flex items-center gap-1"><Truck className="h-2 w-2" /> Transport</Label>
                                <Input 
                                    type="number" 
                                    value={shippingCost || ''} 
                                    onChange={e => setShippingCost(safeNumber(e.target.value))}
                                    className="h-9 text-[11px] font-mono font-black text-right bg-primary/5 border-none shadow-inner text-primary"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex justify-between items-center shadow-lg group hover:bg-primary/20 transition-all">
                        <span className="text-[9px] font-black uppercase text-primary tracking-[0.2em]">Total Flux</span>
                        <span className="text-2xl font-black text-primary tabular-nums tracking-tighter group-hover:scale-105 transition-transform">{formatCurrency(totalValue)}</span>
                    </div>

                    <Button 
                        onClick={handleSave} 
                        disabled={isSubmitting || items.length === 0}
                        className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all gap-3"
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Valider Reception
                    </Button>
                </div>
            </div>
        </div>
    );
}
