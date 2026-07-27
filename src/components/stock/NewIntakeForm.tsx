'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Save, Loader2, Truck, Hash, Barcode, Search, AlertCircle } from 'lucide-react';
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
 * NewIntakeForm Elite - Advanced Logistics Engine.
 * Optimized for rapid entry and high financial precision.
 */
export function NewIntakeForm() {
    const router = useRouter();
    const { processStockIntake } = useAppActions();
    
    const [supplierName, setSupplierName] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [items, setItems] = useState<StockIntakeItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate total value of items (before shipping)
    const itemsTotalValue = useMemo(() => {
        return items.reduce((sum, item) => {
            const rowCents = Math.round(preciseMultiply(safeNumber(item.quantity), safeNumber(item.purchasePrice)) * 100);
            return sum + rowCents;
        }, 0) / 100;
    }, [items]);

    // Shipping factor for proportional landing cost distribution
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
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
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
            toast.success(`${parsedItems.length} articles reconnus.`);
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
        
        setIsSubmitting(true);
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
                toast.success("Réception confirmée et stock mis à jour.");
                router.push('/stock');
            }
        } catch (error: any) {
            toast.error("Échec de la validation réception.", { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'Enter', ctrl: true, action: handleSave, description: 'Valider la réception', ignoreInputFocus: true }
    ], 'NewIntake');

    return (
        <div className="grid lg:grid-cols-12 gap-0.5 bg-border/20 h-full overflow-hidden">
            <div className="lg:col-span-9 bg-card/40 flex flex-col min-h-0">
                <div className="p-2 border-b bg-muted/10">
                    <ProductIntakeCombobox 
                        onProductSelected={handleAddProduct}
                        onNewProductCreated={handleCreateNewProduct}
                    />
                </div>
                <div className="flex-grow overflow-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10">
                            <TableRow className="h-9 border-b border-white/5">
                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground/80 px-4 tracking-widest">Désignation</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground/80 px-2 w-32 tracking-widest">Code-barres</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground/80 text-center px-2 w-20 tracking-widest">Qté</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground/80 text-right px-2 w-28 tracking-widest">P.U Achat</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-primary text-right px-2 w-28 tracking-widest">P.U Vente</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground/30 text-right px-2 w-20 tracking-widest">C. Revient</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground/80 text-right px-4 w-28 tracking-widest">Total</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-64 text-center opacity-10">
                                        <div className="flex flex-col items-center gap-4">
                                            <Search className="h-12 w-12" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Ajoutez des produits ou scannez une facture</p>
                                        </div>
                                    </TableCell>
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
                                                <span className="font-bold text-[11px] uppercase truncate block max-w-[200px]">{item.name}</span>
                                            </TableCell>
                                            <TableCell className="px-2 py-0">
                                                <div className="relative group/bc">
                                                    <Barcode className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 opacity-20 group-focus-within/bc:text-primary transition-colors" />
                                                    <input 
                                                        type="text" 
                                                        value={item.barcodes?.join(', ') || ''} 
                                                        onChange={e => updateItem(item.id, 'barcodes', e.target.value.split(',').map(b => b.trim()))}
                                                        className="w-full h-7 bg-black/20 border-none rounded-lg text-[9px] font-mono font-bold pl-6 pr-2 outline-none shadow-inner text-muted-foreground/80 focus:ring-1 focus:ring-primary/30"
                                                        placeholder="Code..."
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-2 py-0">
                                                <input 
                                                    type="number" 
                                                    value={item.quantity} 
                                                    onChange={e => updateItem(item.id, 'quantity', safeNumber(e.target.value))}
                                                    className="w-full h-8 text-center bg-black/20 border-none rounded-lg text-xs font-black tabular-nums focus:ring-1 focus:ring-primary/40 outline-none shadow-inner"
                                                />
                                            </TableCell>
                                            <TableCell className="px-2 py-0 text-right">
                                                <input 
                                                    type="number" 
                                                    value={item.purchasePrice || ''} 
                                                    onChange={e => updateItem(item.id, 'purchasePrice', safeNumber(e.target.value))}
                                                    className="w-full h-8 text-right bg-black/20 border-none rounded-lg text-xs font-mono font-bold px-3 outline-none"
                                                    placeholder="0.00"
                                                />
                                            </TableCell>
                                            <TableCell className="px-2 py-0 text-right">
                                                <input 
                                                    type="number" 
                                                    value={item.price || ''} 
                                                    onChange={e => updateItem(item.id, 'price', safeNumber(e.target.value))}
                                                    className="w-full h-8 text-right bg-primary/5 border border-primary/10 rounded-lg text-xs text-primary font-mono font-bold px-3 outline-none"
                                                    placeholder="0.00"
                                                />
                                            </TableCell>
                                            <TableCell className="px-2 py-0 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-mono text-[9px] font-bold opacity-30">{landingCost.toFixed(2)}</span>
                                                    <span className={cn("text-[7px] font-black uppercase", margin < 0 ? "text-destructive" : "text-emerald-500/40")}>{margin.toFixed(0)}% marge</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-0 text-right font-mono font-black text-xs tabular-nums text-foreground/80">
                                                {formatCurrency(rowTotal)}
                                            </TableCell>
                                            <TableCell className="px-2 py-0 text-center">
                                                <button onClick={() => removeItem(item.id)} className="text-destructive/20 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
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
            </div>

            <div className="lg:col-span-3 space-y-1.5 p-1.5 bg-muted/5 flex flex-col min-h-0 border-l">
                <ScrollArea className="flex-grow">
                    <div className="space-y-4 pr-1">
                        <OcrInvoiceScanner onResult={handleOcrResult} disabled={isSubmitting} />

                        <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Fournisseur</Label>
                                <Input 
                                    placeholder="Nom du partenaire..." 
                                    className="h-10 text-sm font-black uppercase bg-muted/20 border-none shadow-inner"
                                    value={supplierName}
                                    onChange={e => setSupplierName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Référence Facture</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20" />
                                    <Input 
                                        placeholder="BF-000000" 
                                        className="pl-10 h-10 text-sm font-mono font-bold bg-muted/20 border-none shadow-inner"
                                        value={invoiceNumber}
                                        onChange={e => setInvoiceNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Date d'Opération</Label>
                                <DatePicker date={invoiceDate} setDate={setInvoiceDate} className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-primary/60 ml-1 flex items-center gap-1.5">
                                    <Truck className="h-3 w-3" /> Frais de Transport
                                </Label>
                                <Input 
                                    type="number" 
                                    value={shippingCost || ''} 
                                    onChange={e => setShippingCost(safeNumber(e.target.value))}
                                    className="h-10 text-base font-mono font-black text-right bg-primary/5 border-none shadow-inner text-primary"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 flex justify-between items-center shadow-lg">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black uppercase text-primary/60 tracking-widest">Valeur de Réception</p>
                                <span className="text-[8px] font-bold text-primary/40 uppercase">Total Net TTC</span>
                            </div>
                            <span className="text-xl font-black text-primary tabular-nums tracking-tighter">{formatCurrency(totalValue)}</span>
                        </div>
                    </div>
                </ScrollArea>

                <Button 
                    onClick={handleSave} 
                    disabled={isSubmitting || items.length === 0}
                    className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all gap-3 mt-auto"
                >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Valider la Réception [Enter]
                </Button>
            </div>
        </div>
    );
}

function ScrollArea({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={cn("overflow-y-auto", className)}>{children}</div>;
}
