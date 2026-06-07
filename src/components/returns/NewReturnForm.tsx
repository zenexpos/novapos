'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
                toast.success("Retour validé. Avoir généré.");
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
        <div className="grid lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-8 space-y-6">
                <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-4 flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <Receipt className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-semibold tracking-tight">Source de Vente</CardTitle>
                        </div>
                        <div className="relative flex-grow max-w-md group">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-30" />
                            <Input 
                                placeholder="N° Facture (ex: 240412-1234)..."
                                className="pl-10 h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold"
                                value={searchInvoice}
                                onChange={e => setSearchInvoice(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchSale(searchInvoice)}
                            />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => fetchSale(searchInvoice)}
                                disabled={isLoadingSale}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                            >
                                {isLoadingSale ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                        {!sale ? (
                            <div className="h-80 flex flex-col items-center justify-center text-center p-6 opacity-20 space-y-4">
                                <Search className="h-16 w-16" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Saisissez un numéro de facture pour charger les flux</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-black/20 border-none">
                                        <TableRow className="border-white/5">
                                            <TableHead className="w-[50px] p-4"></TableHead>
                                            <TableHead className="font-bold text-[10px] uppercase text-muted-foreground/60 p-4">Désignation</TableHead>
                                            <TableHead className="font-bold text-[10px] uppercase text-muted-foreground/60 text-center">Facturé</TableHead>
                                            <TableHead className="font-bold text-[10px] uppercase text-muted-foreground/60 text-center">Renvoyé</TableHead>
                                            <TableHead className="font-bold text-[10px] uppercase text-muted-foreground/60 text-center">Stock</TableHead>
                                            <TableHead className="font-bold text-[10px] uppercase text-muted-foreground/60 text-right">Valeur</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sale.items.map((item) => {
                                            const uuid = item.productUuid || `null-${item.name}`;
                                            const isSelected = !!selectedItems[uuid];
                                            return (
                                                <TableRow key={uuid} className={cn("border-white/5 group transition-all", isSelected ? "bg-primary/5" : "hover:bg-white/5")}>
                                                    <TableCell className="p-4">
                                                        <Checkbox 
                                                            checked={isSelected}
                                                            onCheckedChange={c => handleToggleItem(uuid, !!c)}
                                                            className="h-5 w-5 border-primary data-[state=checked]:bg-primary rounded-md"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-4">
                                                        <p className="font-bold text-sm tracking-tight">{item.name}</p>
                                                        <p className="text-[10px] font-semibold text-muted-foreground/40">{formatCurrency(item.price)}/u</p>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-center">
                                                        <span className="text-xs font-bold opacity-40">{item.quantity}</span>
                                                    </TableCell>
                                                    <TableCell className="p-4">
                                                        <Input 
                                                            type="number"
                                                            disabled={!isSelected}
                                                            value={selectedItems[uuid]?.quantity || 0}
                                                            onChange={e => updateReturnQty(uuid, parseFloat(e.target.value) || 0)}
                                                            className="w-20 h-8 mx-auto text-center font-bold bg-black/20 border-none shadow-inner"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-4 text-center">
                                                        <Button 
                                                            variant="ghost" 
                                                            disabled={!isSelected}
                                                            onClick={() => setSelectedItems(prev => ({ ...prev, [uuid]: { ...prev[uuid], restock: !prev[uuid].restock } }))}
                                                            className={cn(
                                                                "h-8 rounded-lg text-[9px] font-bold uppercase w-full gap-2 transition-all border",
                                                                !isSelected ? "opacity-10" : 
                                                                selectedItems[uuid].restock ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                                                            )}
                                                        >
                                                            {isSelected && selectedItems[uuid].restock ? <PackageCheck className="h-3.5 w-3.5" /> : <PackageX className="h-3.5 w-3.5" />}
                                                            {isSelected && (selectedItems[uuid].restock ? 'Rentrée' : 'Talon')}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right font-mono font-bold text-sm">
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

            <div className="lg:col-span-4 space-y-6">
                <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden sticky top-24 shadow-xl">
                    <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 p-4">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-amber-600 flex items-center gap-2">
                            <Undo2 className="h-4 w-4" /> Bilan de Régularisation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {sale ? (
                            <div className="space-y-6">
                                <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-3 shadow-inner">
                                    <div className="flex items-center gap-3 text-muted-foreground/60 border-b border-white/5 pb-2 mb-2">
                                        <User className="h-4 w-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Partenaire Client</span>
                                    </div>
                                    <p className="font-black text-base tracking-tight">{customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase opacity-40">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {format(safeToDate(sale.createdAt!), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground/60 ml-1">Motif du retour</Label>
                                        <textarea 
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="Commentaires..."
                                            className="w-full h-24 rounded-xl bg-black/20 border-none shadow-inner p-4 text-sm resize-none"
                                        />
                                    </div>

                                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-semibold uppercase text-emerald-600 flex items-center gap-2">
                                                <Coins className="h-3.5 w-3.5" /> Remboursé en Cash
                                            </Label>
                                            <Input 
                                                type="number" 
                                                value={amountRefunded || ''}
                                                onChange={e => setAmountRefunded(parseFloat(e.target.value) || 0)}
                                                className="w-24 h-9 text-right rounded-lg bg-background border-none shadow-sm font-mono font-bold text-emerald-600"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-3">
                                    <div className="flex justify-between items-center text-xs font-semibold uppercase text-muted-foreground/40">
                                        <span>Valeur Marchandise</span>
                                        <span className="font-mono text-foreground font-bold">{formatCurrency(totalReturnValue)}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Avoir INALT</span>
                                        <span className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(creditToCustomer)}</span>
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleSaveReturn}
                                    disabled={isSubmitting || Object.keys(selectedItems).length === 0}
                                    className="w-full h-14 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-[0.98] gap-3 bg-amber-500 hover:bg-amber-600 text-white border-none"
                                >
                                    {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                                    Valider Retour [Ctrl+Enter]
                                </Button>
                            </div>
                        ) : (
                            <div className="py-10 text-center space-y-4 opacity-20">
                                <AlertCircle className="h-12 w-12 mx-auto" />
                                <p className="text-[10px] font-black uppercase tracking-widest max-w-[200px] mx-auto">En attente d'une facture source...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
