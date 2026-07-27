'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Save, Loader2, Truck, Calendar as CalendarIcon, Hash } from 'lucide-react';
import { ProductIntakeCombobox } from './ProductIntakeCombobox';
import { OcrInvoiceScanner } from './OcrInvoiceScanner';
import { DatePicker } from '@/components/ui/date-picker';
import type { Product, StockIntakeItem } from '@/lib/types';
import { formatCurrency, cn, safeNumber, preciseMultiply, roundFinancial } from '@/lib/utils';
import { useAppActions } from '@/stores/appStore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ocrParserService } from '@/services/ocr-parser.service';

/**
 * NewIntakeForm - Elite Logistics Engine.
 * Optimized for high-speed entry, OCR support, and precise landing cost distribution.
 */
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

    // Value-based pro-rata distribution factor
    const shippingFactor = useMemo(() => {
        return itemsTotalValue > 0 ? shippingCost / itemsTotalValue : 0;
    }, [itemsTotalValue, shippingCost]);

    const totalValue = roundFinancial(itemsTotalValue + shippingCost);

    const handleAddProduct = useCallback((product: Product) => {
        const existing = items.find(i => i.productUuid === product.uuid);
        if (existing) {
            toast.info(`"${product.name}" est déjà dans la liste.`);
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
                barcodes: p.barcodes || [],
                quantityDamaged: 0,
                unit: p.unit || 'Pièce',
                isNew: p.isNew ?? true
            }));
            setItems(prev => [...newIntakeItems, ...prev]);
            toast.success(`${parsedItems.length} articles détectés.`);
        }
    }, []);

    const handleSave = async () => {
        if (!supplierName.trim()) { 
            toast.error("Veuillez spécifier le fournisseur."); 
            return; 
        }
        if (items.length === 0) { 
            toast.error("La liste de réception est vide."); 
            return; 
        }
        
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
                toast.success("Mise à jour du stock réussie.");
                router.push('/stock');
            }
        } catch (error: any) {
            toast.error("Échec de la validation de la réception.");
        } finally {
            setIsSaving(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'Enter', ctrl: true, action: handleSave, description: 'Valider réception', ignoreInputFocus: true }
    ], 'NewIntake');

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
                                    <TableRow className="h-8 border-b-border/40">
                                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/60 px-4">Désignation</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/60 text-center px-2 w-24">Qté</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/60 text-right px-2 w-32">P.U Achat</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-primary text-right px-2 w-32">P.U Vente</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/30 text-right px-2 w-24">Revient</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-emerald-500/40 text-right px-2 w-20">Marge</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/60 text-right px-4 w-32">Ligne</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-64 text-center opacity-10 text-[10px] font-black uppercase tracking-[0.4em]">En attente de saisie de stock</TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item) => {
                                            const qty = safeNumber(item.quantity);
                                            const cost = safeNumber(item.purchasePrice);
                                            const sellPrice = safeNumber(item.price);
                                            const landingCost = roundFinancial(cost * (1 + shippingFactor));
                                            const rowTotal = preciseMultiply(qty, cost);
                                            const margin = sellPrice > 0 ? ((sellPrice - landingCost) / sellPrice) * 100 : 0;
                                            
                                            return (
                                                <TableRow key={item.id} className="hover:bg-white/5 border-b border-border/10 h-10 transition-colors group">
                                                    <TableCell className="px-4 py-0">
                                                        <span className="font-bold text-xs uppercase truncate block max-w-[450px]">{item.name}</span>
                                                    </TableCell>
                                                    <TableCell className="px-2 py-0">
                                                        <input 
                                                            type="number" 
                                                            value={item.quantity} 
                                                            onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                                                            className="w-full h-8 text-center bg-black/20 border-none rounded-lg text-xs font-black tabular-nums focus:ring-1 focus:ring-primary/40 outline-none shadow-inner"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2 py-0 text-right">
                                                        <input 
                                                            type="number" 
                                                            value={item.purchasePrice || ''} 
                                                            onChange={e => updateItem(item.id, 'purchasePrice', e.target.value)}
                                                            className="w-full h-8 text-right bg-black/20 border-none rounded-lg text-xs font-mono font-bold tabular-nums outline-none shadow-inner px-3"
                                                            placeholder="0.00"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2 py-0 text-right">
                                                        <input 
                                                            type="number" 
                                                            value={item.price || ''} 
                                                            onChange={e => updateItem(item.id, 'price', e.target.value)}
                                                            className="w-full h-8 text-right bg-primary/5 border border-primary/10 rounded-lg text-xs text-primary font-mono font-bold tabular-nums outline-none shadow-inner px-3"
                                                            placeholder="0.00"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2 py-0 text-right">
                                                        <span className="font-mono text-[10px] font-bold opacity-30 tabular-nums">{landingCost.toFixed(2)}</span>
                                                    </TableCell>
                                                    <TableCell className="px-2 py-0 text-right">
                                                        <span className={cn("text-[11px] font-black tabular-nums", margin < 0 ? "text-destructive" : "text-emerald-500/50")}>
                                                            {margin.toFixed(0)}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-0 text-right font-mono font-black text-xs tabular-nums text-foreground/80">
                                                        {formatCurrency(rowTotal)}
                                                    </TableCell>
                                                    <TableCell className="px-2 py-0 text-center">
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

            <div className="lg:col-span-3 space-y-2 p-2">
                <div className="sticky top-2 space-y-2">
                    <OcrInvoiceScanner onResult={handleOcrResult} disabled={isSubmitting} />

                    <div className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Partenaire Fournisseur</Label>
                            <Input 
                                placeholder="Nom de l'établissement..." 
                                className="h-10 text-xs font-black uppercase bg-muted/20 border-none shadow-inner"
                                value={supplierName}
                                onChange={e => setSupplierName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Référence Bon / Facture</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20" />
                                    <Input 
                                        placeholder="Ex: BF-2024-001" 
                                        className="pl-9 h-10 text-xs font-mono font-bold bg-muted/20 border-none shadow-inner"
                                        value={invoiceNumber}
                                        onChange={e => setInvoiceNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Date du document</Label>
                                <DatePicker date={invoiceDate} setDate={setInvoiceDate} className="h-10 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase text-primary/60 ml-1 flex items-center gap-1"><Truck className="h-2.5 w-2.5" /> Frais de Transport</Label>
                                <Input 
                                    type="number" 
                                    value={shippingCost || ''} 
                                    onChange={e => setShippingCost(safeNumber(e.target.value))}
                                    className="h-10 text-sm font-mono font-black text-right bg-primary/5 border-none shadow-inner text-primary"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 flex justify-between items-center shadow-lg group hover:bg-primary/20 transition-all">
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Total TTC</span>
                        <span className="text-2xl font-black text-primary tabular-nums tracking-tighter group-hover:scale-105 transition-transform">{formatCurrency(totalValue)}</span>
                    </div>

                    <Button 
                        onClick={handleSave} 
                        disabled={isSubmitting || items.length === 0}
                        className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all gap-3"
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Valider Réception
                    </Button>
                </div>
            </div>
        </div>
    );
}
