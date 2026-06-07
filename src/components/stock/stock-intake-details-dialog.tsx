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
import type { StockIntake, CompanyProfile } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Printer, X, Archive, Hash, Calendar, Building, Truck } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface StockIntakeDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    intake: StockIntake | null;
    supplierName?: string;
}

const PrintableIntake = React.forwardRef<HTMLDivElement, { intake: StockIntake, supplierName: string, profile: CompanyProfile | null }>(({ intake, supplierName, profile }, ref) => {
    return (
        <div ref={ref} className="p-4 bg-white text-black font-sans w-[210mm] min-h-[297mm]">
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                <div>
                    <h1 className="text-xl font-semibold uppercase">{profile?.companyName || 'iPOS Manager'}</h1>
                    <p className="text-sm">{profile?.address}</p>
                    <p className="text-sm">{profile?.phone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold bg-black text-white px-4 py-1 inline-block">BON DE RÉCEPTION</h2>
                    <p className="mt-2 font-mono">N° {intake.invoiceNumber || intake.uuid.substring(0, 8)}</p>
                    <p className="text-sm">Date: {format(safeToDate(intake.invoiceDate), 'dd/MM/yyyy')}</p>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Fournisseur</h3>
                <p className="text-xl font-bold">{supplierName}</p>
            </div>

            <table className="w-full border-collapse mb-8">
                <thead>
                    <tr className="border-b-2 border-black bg-gray-100">
                        <th className="py-3 text-left px-2">Désignation Produit</th>
                        <th className="py-3 text-center px-2">Qté Reçue</th>
                        <th className="py-3 text-right px-2">P.U Achat</th>
                        <th className="py-3 text-right px-2">Coût Revient</th>
                        <th className="py-3 text-right px-2">Montant</th>
                    </tr>
                </thead>
                <tbody>
                    {intake.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-300">
                            <td className="py-3 px-2 font-medium">{item.productName}</td>
                            <td className="py-3 px-2 text-center">{item.quantityReceived}</td>
                            <td className="py-3 px-2 text-right">{Number(item.purchasePrice || 0).toFixed(2)}</td>
                            <td className="py-3 px-2 text-right">{Number(item.landingCost || item.purchasePrice || 0).toFixed(2)}</td>
                            <td className="py-3 px-2 text-right font-bold">{(Number(item.quantityReceived || 0) * Number(item.purchasePrice || 0)).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-80 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Sous-total Marchandise:</span>
                        <span>{formatCurrency(intake.totalValue - (intake.shippingCost || 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Frais de Transport:</span>
                        <span>{formatCurrency(intake.shippingCost || 0)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t-2 border-black pt-2">
                        <span>TOTAL GÉNÉRAL:</span>
                        <span>{formatCurrency(intake.totalValue)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-20 flex justify-between px-4 italic text-sm text-gray-400">
                <div className="text-center border-t border-dashed border-gray-300 pt-2 w-40">Cachet & Signature</div>
                <div className="text-center border-t border-dashed border-gray-300 pt-2 w-40">Signature Fournisseur</div>
            </div>
        </div>
    );
});
PrintableIntake.displayName = 'PrintableIntake';

export function StockIntakeDetailsDialog({
    isOpen,
    onOpenChange,
    intake,
    supplierName = 'Fournisseur Inconnu',
}: StockIntakeDetailsDialogProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const profile = useAppStore(state => state.companyProfile);

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

    // Raccourcis pour les détails de réception
    useKeyboardShortcuts([
        {
            key: 'p',
            ctrl: true,
            action: handlePrint,
            description: 'Imprimer le bon',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer',
            ignoreInputFocus: true
        }
    ], 'DétailsRéception', isOpen);

    if (!intake) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-sm rounded-3xl">
                <DialogHeader className="bg-primary/5 p-6 border-b border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                            <Archive className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Détails de la Réception</DialogTitle>
                            <DialogDescription className="font-medium flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {intake.invoiceNumber || 'Sans Numéro'}</span>
                                <span className="text-primary/20">•</span>
                                <span className="flex items-center gap-1 text-primary font-bold"><Building className="h-3 w-3" /> {supplierName}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide mb-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Date Facture
                            </p>
                            <p className="font-bold text-xs">{format(safeToDate(intake.invoiceDate), 'dd MMM yyyy', { locale: fr })}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide mb-1">Articles</p>
                            <p className="font-bold text-xs">{intake.items.length} types</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                            <p className="text-[10px] uppercase font-bold text-primary tracking-wide mb-1 flex items-center gap-1">
                                <Truck className="h-3 w-3" /> Transport
                            </p>
                            <p className="font-semibold text-primary">{formatCurrency(intake.shippingCost || 0)}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                            <p className="text-[10px] uppercase font-bold opacity-70 tracking-wide mb-1">Total Général</p>
                            <p className="text-lg font-semibold">{formatCurrency(intake.totalValue)}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="font-bold">Produit</TableHead>
                                    <TableHead className="text-center font-bold">Qté</TableHead>
                                    <TableHead className="text-right font-bold">P.U Achat</TableHead>
                                    <TableHead className="text-right font-bold bg-primary/5 text-primary">C. Revient</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {intake.items.map((item, index) => (
                                    <TableRow key={index} className="hover:bg-muted/10 transition-colors">
                                        <TableCell>
                                            <div className="font-bold text-sm tracking-tight">{item.productName}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="px-2 py-1 rounded-md bg-muted font-mono font-bold text-xs">
                                                {item.quantityReceived}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-xs">
                                            {formatCurrency(item.purchasePrice)}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-primary bg-primary/5">
                                            {formatCurrency(item.landingCost || item.purchasePrice)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="hidden">
                    <PrintableIntake ref={printRef} intake={intake} supplierName={supplierName} profile={profile} />
                </div>

                <DialogFooter className="p-6 bg-card border-t flex gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold flex-1">
                        <X className="mr-2 h-4 w-4" /> Fermer [Esc]
                    </Button>
                    <Button onClick={handlePrint} className="rounded-xl h-12 font-bold flex-1 shadow-lg shadow-sm">
                        <Printer className="mr-2 h-4 w-4" /> Imprimer [Ctrl+P]
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}