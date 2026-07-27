'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Undo2, User, Receipt, Hash, Calendar, Loader2, Save, PackageCheck, PackageX, AlertCircle, Coins } from 'lucide-react';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import type { Sale, Customer, ReturnItem } from '@/lib/types';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppActions } from '@/stores/appStore';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function NewReturnForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { processReturn } = useAppActions();

    const [searchInvoice, setSearchInvoice] = useState(searchParams.get('invoice') || '');
    const [isLoadingSale, setIsLoadingSale] = useState(false);
    const [sale, setSale] = useState<Sale | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    
    const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number, restock: boolean }>>({});
    const [amountRefunded, setAmountRefunded] = useState<number>(0);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSale = useCallback(async (invoice: string) => {
        if (!invoice.trim()) return;
        setIsLoadingSale(true);
        try {
            const data = await salesService.getSaleByInvoiceNumber(invoice.trim());
            if (data) {
                setSale(data);
                if (data.customerUuid) {
                    const cust = await customerService.getCustomerByUuid(data.customerUuid);
                    setCustomer(cust || null);
                }
                setSelectedItems({});
                setAmountRefunded(0);
                toast.success(`Facture #${data.invoiceNumber} identifiée.`);
            } else {
                toast.error("Facture introuvable.");
                setSale(null);
            }
        } catch (e) {
            toast.error("Erreur de recherche.");
        } finally {
            setIsLoadingSale(false);
        }
    }, []);

    useEffect(() => {
        const inv = searchParams.get('invoice');
        if (inv) fetchSale(inv);
    }, [searchParams, fetchSale]);

    const handleToggleItem = (uuid: string, checked: boolean) => {
        if (checked) {
            const originalItem = sale?.items.find(i => i.productUuid === uuid);
            setSelectedItems(prev => ({ 
                ...prev, 
                [uuid]: { quantity: originalItem?.quantity || 1, restock: true } 
            }));
        } else {
            const next = { ...selectedItems };
            delete next[uuid];
            setSelectedItems(next);
        }
    };

    const updateReturnQty = (uuid: string, qty: number) => {
        const originalItem = sale?.items.find(i => i.productUuid === uuid);
        const max = originalItem?.quantity || 0;
        const finalQty = Math.min(max, Math.max(1, qty));
        setSelectedItems(prev => ({ 
            ...prev, 
            [uuid]: { ...prev[uuid], quantity: finalQty } 
        }));
    };

    const totalReturnValue = useMemo(() => {
        if (!sale) return 0;
        return Object.entries(selectedItems).reduce((sum, [uuid, info]) => {
            const item = sale.items.find(i => i.productUuid === uuid);
            return sum + (info.quantity * (item?.price || 0));
        }, 0);
    }, [sale, selectedItems]);

    const creditToCustomer = Math.max(0, totalReturnValue - amountRefunded);

    const handleSaveReturn = async () => {
        if (!sale) return;
        const itemsToReturn: ReturnItem[] = Object.entries(selectedItems).map(([uuid, info]) => {
            const original = sale.items.find(i => i.productUuid === uuid)!;
            return {
                productUuid: uuid.startsWith('null') ? null : uuid,
                productName: original.name,
                quantity: info.quantity,
                price: original.price,
                purchasePrice: original.purchasePrice,
                wasRestocked: info.restock
            };
        });

        if (itemsToReturn.length === 0) {
            toast.error("Aucun article sélectionné.");
            return;
        }

        setIsSubmitting(true);
        try {
            const success = await processReturn({
                originalSaleUuid: sale.uuid,
                items: itemsToReturn,
                totalReturnValue,
                amountRefunded,
                customerUuid: sale.customerUuid,
                notes: notes.trim() || undefined
            });

            if (success) {
                toast.success("Retour validé.");
                router.push('/returns');
            }
        } catch (e) {
            toast.error("Échec de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useKeyboardShortcuts([
        {
            key: 'Enter',
            ctrl: true,
            action: handleSaveReturn,
            description: 'Valider le bon de retour',
            ignoreInputFocus: true
        }
    ], 'Facturation', !!sale);

    return (
        <div className="grid lg:grid-cols-12 gap-2 animate-in fade-in duration-500">
            <div className="lg:col-span-8 space-y-2">
                <Card className="rounded-xl border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-3 flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-primary opacity-50" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Facture Source</CardTitle>
                        </div>
                        <div className="relative flex-grow max-w-sm group">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-30" />
                            <Input 
                                placeholder="N° Facture..."
                                className="pl-9 h-9 rounded-lg bg-black/20 border-none shadow-inner font-mono font-bold text-xs"
                                value={searchInvoice}
                                onChange={e => setSearchInvoice(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchSale(searchInvoice)}
                            />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => fetchSale(searchInvoice)}
                                disabled={isLoadingSale}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            >
                                {isLoadingSale ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                        {!sale ? (
                            <div className="h-60 flex flex-col items-center justify-center text-center p-6 opacity-20">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">En attente d'identification...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-black/10 border-none">
                                        <TableRow className="border-white/5 h-8">
                                            <TableHead className="w-[40px] p-2 text-center"></TableHead>
                                            <TableHead className="font-black text-[8px] uppercase text-muted-foreground/50 p-2">Désignation</TableHead>
                                            <TableHead className="font-black text-[8px] uppercase text-muted-foreground/50 text-center p-2">Qté</TableHead>
                                            <TableHead className="font-black text-[8px] uppercase text-muted-foreground/50 text-center p-2">Retour</TableHead>
                                            <TableHead className="font-black text-[8px] uppercase text-muted-foreground/50 text-center p-2">Action</TableHead>
                                            <TableHead className="font-black text-[8px] uppercase text-muted-foreground/50 text-right p-2">Valeur</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sale.items.map((item) => {
                                            const uuid = item.productUuid || `null-${item.name}`;
                                            const isSelected = !!selectedItems[uuid];
                                            return (
                                                <TableRow key={uuid} className={cn("border-white/5 h-10 transition-colors", isSelected ? "bg-primary/5" : "hover:bg-white/5")}>
                                                    <TableCell className="p-2 text-center">
                                                        <Checkbox 
                                                            checked={isSelected}
                                                            onCheckedChange={c => handleToggleItem(uuid, !!c)}
                                                            className="h-4 w-4 border-primary/20 data-[state=checked]:bg-primary"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <p className="font-bold text-[11px] uppercase truncate max-w-[200px]">{item.name}</p>
                                                        <p className="text-[8px] font-bold text-muted-foreground/40">{formatCurrency(item.price)}/u</p>
                                                    </TableCell>
                                                    <TableCell className="p-2 text-center">
                                                        <span className="text-[10px] font-black opacity-20 tabular-nums">{item.quantity}</span>
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input 
                                                            type="number"
                                                            disabled={!isSelected}
                                                            value={selectedItems[uuid]?.quantity || 0}
                                                            onChange={e => updateReturnQty(uuid, parseFloat(e.target.value) || 0)}
                                                            className="w-16 h-7 mx-auto text-center font-black text-xs bg-black/20 border-none shadow-inner p-0"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-2 text-center">
                                                        <button 
                                                            disabled={!isSelected}
                                                            onClick={() => setSelectedItems(prev => ({ ...prev, [uuid]: { ...prev[uuid], restock: !prev[uuid].restock } }))}
                                                            className={cn(
                                                                "px-2 py-1 rounded-md text-[7px] font-black uppercase border transition-all",
                                                                !isSelected ? "opacity-10 grayscale" : 
                                                                selectedItems[uuid].restock ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                                                            )}
                                                        >
                                                            {isSelected && (selectedItems[uuid].restock ? 'Rentrée Stock' : 'Talon/Perte')}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="p-2 text-right font-mono font-black text-[10px] tabular-nums">
                                                        {isSelected ? formatCurrency(selectedItems[uuid].quantity * item.price) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-4">
                <Card className="rounded-xl border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden sticky top-20 shadow-sm">
                    <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 p-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                            Bilan de Régularisation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {sale ? (
                            <div className="space-y-4">
                                <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1 shadow-inner">
                                    <p className="text-[8px] font-black uppercase text-muted-foreground/30 tracking-widest">Partenaire Client</p>
                                    <p className="font-black text-xs uppercase truncate">{customer ? `${customer.firstName} ${customer.lastName}` : 'Passage'}</p>
                                    <div className="flex items-center gap-1.5 text-[8px] font-bold opacity-30 uppercase mt-1">
                                        <Calendar className="h-2 w-2" />
                                        {format(safeToDate(sale.createdAt!), 'dd/MM/yy HH:mm', { locale: fr })}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-[8px] font-black uppercase text-muted-foreground/40 ml-1">Commentaires</Label>
                                        <textarea 
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="..."
                                            className="w-full h-16 rounded-xl bg-black/20 border-none shadow-inner p-3 text-[11px] font-medium resize-none focus:ring-1 focus:ring-primary/20"
                                        />
                                    </div>

                                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-center justify-between">
                                        <Label className="text-[8px] font-black uppercase text-emerald-600 flex items-center gap-1.5">
                                            <Coins className="h-3 w-3" /> Remboursé Cash
                                        </Label>
                                        <Input 
                                            type="number" 
                                            value={amountRefunded || ''}
                                            onChange={e => setAmountRefunded(parseFloat(e.target.value) || 0)}
                                            className="w-24 h-8 text-right rounded-lg bg-background border-none shadow-sm font-mono font-black text-xs text-emerald-600"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 space-y-2">
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase text-muted-foreground/30">
                                        <span>Valeur Marchandise</span>
                                        <span className="font-mono">{formatCurrency(totalReturnValue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl border border-primary/10">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Avoir au Compte</span>
                                        <span className="text-lg font-black text-primary tabular-nums tracking-tighter">{formatCurrency(creditToCustomer)}</span>
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleSaveReturn}
                                    disabled={isSubmitting || Object.keys(selectedItems).length === 0}
                                    className="w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 gap-2 bg-amber-500 hover:bg-amber-600 text-white border-none"
                                >
                                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    Valider Retour [Ctrl+Enter]
                                </Button>
                            </div>
                        ) : (
                            <div className="py-10 text-center opacity-10">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-[8px] font-black uppercase tracking-widest">Identifiez une facture source</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
