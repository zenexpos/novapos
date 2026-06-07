'use client';
import React, { useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, X, Undo2, Hash, Calendar, User, PackageCheck, PackageX } from 'lucide-react';
import type { ProductReturn, CompanyProfile } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';

interface ReturnDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    productReturn: ProductReturn | null;
    customerName?: string;
}

const PrintableReturn = React.forwardRef<HTMLDivElement, { productReturn: ProductReturn, customerName: string, profile: CompanyProfile | null }>(({ productReturn, customerName, profile }, ref) => {
    return (
        <div ref={ref} className="p-4 bg-white text-black font-sans w-[210mm] min-h-[297mm]">
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                <div>
                    <h1 className="text-xl font-semibold uppercase">{profile?.companyName || 'iPOS Manager'}</h1>
                    <p className="text-sm">{profile?.address}</p>
                    <p className="text-sm">{profile?.phone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold bg-black text-white px-4 py-1 inline-block">BON DE RETOUR</h2>
                    <p className="mt-2 font-mono">Facture Origine: #{productReturn.originalInvoiceNumber}</p>
                    <p className="text-sm">Date Retour: {format(safeToDate(productReturn.createdAt!), 'dd/MM/yyyy HH:mm')}</p>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase text-gray-500 mb-1">Client</h3>
                <p className="text-xl font-bold">{customerName}</p>
            </div>

            <table className="w-full border-collapse mb-8">
                <thead>
                    <tr className="border-b-2 border-black bg-gray-100">
                        <th className="py-3 text-left px-2">Désignation Produit</th>
                        <th className="py-3 text-center px-2">Qté</th>
                        <th className="py-3 text-right px-2">P.U Vente</th>
                        <th className="py-3 text-right px-2">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {productReturn.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-300">
                            <td className="py-3 px-2 font-medium">{item.productName}</td>
                            <td className="py-3 px-2 text-center">{item.quantity}</td>
                            <td className="py-3 px-2 text-right">{Number(item.price || 0).toFixed(2)}</td>
                            <td className="py-3 px-2 text-right font-bold">{(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-80 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Valeur Marchandise:</span>
                        <span>{formatCurrency(productReturn.totalReturnValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Montant Remboursé:</span>
                        <span>{formatCurrency(productReturn.amountRefunded)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t-2 border-black pt-2">
                        <span>CRÉDIT CLIENT:</span>
                        <span>{formatCurrency(productReturn.totalReturnValue - productReturn.amountRefunded)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-20 flex justify-between px-4 italic text-sm text-gray-400">
                <div className="text-center border-t border-dashed border-gray-300 pt-2 w-40">Visa Magasin</div>
                <div className="text-center border-t border-dashed border-gray-300 pt-2 w-40">Signature Client</div>
            </div>
        </div>
    );
});
PrintableReturn.displayName = 'PrintableReturn';

export function ReturnDetailsDialog({
    isOpen,
    onOpenChange,
    productReturn,
    customerName = 'Client de passage',
}: ReturnDetailsDialogProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const profile = useAppStore(state => state.companyProfile);

    if (!productReturn) return null;

    const handlePrint = () => {
        const printableContent = document.getElementById('receipt-for-print');
        const element = printRef.current;
        if (!printableContent || !element) return;

        const clone = element.cloneNode(true) as HTMLDivElement;
        clone.classList.add('a4-receipt');
        printableContent.innerHTML = '';
        printableContent.appendChild(clone);

        setTimeout(() => window.print(), 100);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-sm rounded-3xl">
                <DialogHeader className="bg-amber-500/10 p-6 border-b border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                            <Undo2 className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Détails du Retour</DialogTitle>
                            <DialogDescription className="font-medium flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 font-mono"><Hash className="h-3 w-3" /> Origine: {productReturn.originalInvoiceNumber}</span>
                                <span className="text-amber-500/20">•</span>
                                <span className="flex items-center gap-1 text-amber-600 font-bold"><User className="h-3 w-3" /> {customerName}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Summary Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide mb-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Date Retour
                            </p>
                            <p className="font-bold text-xs">{format(safeToDate(productReturn.createdAt!), 'dd MMM yyyy', { locale: fr })}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide mb-1">Articles</p>
                            <p className="font-bold text-xs">{productReturn.items.length} article(s)</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wide mb-1">Remboursé</p>
                            <p className="font-semibold text-emerald-600">{formatCurrency(productReturn.amountRefunded)}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                            <p className="text-[10px] uppercase font-bold opacity-70 tracking-wide mb-1">Valeur Retour</p>
                            <p className="text-lg font-semibold">{formatCurrency(productReturn.totalReturnValue)}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="font-bold">Produit</TableHead>
                                    <TableHead className="text-center font-bold">Qté</TableHead>
                                    <TableHead className="text-right font-bold">P.U Vente</TableHead>
                                    <TableHead className="text-center font-bold">Stock</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productReturn.items.map((item, index) => (
                                    <TableRow key={index} className="hover:bg-muted/10 transition-colors">
                                        <TableCell>
                                            <div className="font-bold text-sm tracking-tight">{item.productName}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="px-2 py-1 rounded-md bg-muted font-mono font-bold text-xs">
                                                {item.quantity}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-xs">
                                            {formatCurrency(item.price)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {item.wasRestocked ? (
                                                <div className="flex items-center justify-center text-emerald-500 gap-1 text-[10px] font-semibold uppercase">
                                                    <PackageCheck className="h-3 w-3" /> Réintégré
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center text-destructive gap-1 text-[10px] font-semibold uppercase">
                                                    <PackageX className="h-3 w-3" /> Perte/Talon
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {productReturn.notes && (
                        <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Observations / Motifs</p>
                            <p className="text-sm italic text-muted-foreground">{productReturn.notes}</p>
                        </div>
                    )}
                </div>

                {/* Hidden Printable Area */}
                <div className="hidden">
                    <PrintableReturn ref={printRef} productReturn={productReturn} customerName={customerName} profile={profile} />
                </div>

                <DialogFooter className="p-6 bg-card border-t flex gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold flex-1">
                        <X className="mr-2 h-4 w-4" /> Fermer
                    </Button>
                    <Button onClick={handlePrint} className="rounded-xl h-12 font-bold flex-1 shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white border-none">
                        <Printer className="mr-2 h-4 w-4" /> Imprimer le Bon
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
