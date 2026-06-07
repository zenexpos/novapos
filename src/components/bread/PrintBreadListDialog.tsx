'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Printer, X } from 'lucide-react';
import type { BreadOrderWithCustomer, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';

interface PrintBreadListDialogProps {
    orders: BreadOrderWithCustomer[];
    currentDate: string;
}

const PrintableList = React.forwardRef<HTMLDivElement, { orders: BreadOrderWithCustomer[], currentDate: string, profile: CompanyProfile | null }>(({ orders, currentDate, profile }, ref) => {
    const totalQuantity = orders.reduce((acc, order) => acc + order.quantite, 0);
    const formattedDate = format(new Date(currentDate.replace(/-/g, '/')), 'EEEE d MMMM yyyy', { locale: fr });
    
    return (
        <div ref={ref} className="p-4 bg-white text-black font-sans w-[210mm] min-h-[297mm]">
            <header className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                <div>
                    <h1 className="text-xl font-semibold uppercase">{profile?.companyName || 'iPOS Manager'}</h1>
                    <p className="text-sm font-bold mt-1 text-gray-600">Distribution de Pain</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold bg-black text-white px-4 py-1 inline-block">LISTE DE DISTRIBUTION</h2>
                    <p className="mt-2 font-bold text-lg">{formattedDate}</p>
                </div>
            </header>

            <table className="w-full border-collapse mb-10">
                <thead>
                    <tr className="bg-gray-100 border-b-2 border-black">
                        <th className="py-3 text-left px-4">Nom du Client</th>
                        <th className="py-3 text-center px-4 w-40">Quantité</th>
                        <th className="py-3 text-center px-4 w-32">Visa</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.sort((a,b) => {
                        const nameA = a.customer ? `${a.customer.firstName}` : (a.customName || '');
                        const nameB = b.customer ? `${b.customer.firstName}` : (b.customName || '');
                        return nameA.localeCompare(nameB);
                    }).map(order => {
                        const displayName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : (order.customName || 'Inconnu');
                        return (
                            <tr key={order.uuid} className="border-b border-gray-300">
                                <td className="py-5 px-4">
                                    <p className="font-bold text-xl">{displayName}</p>
                                </td>
                                <td className="py-5 px-4 text-center">
                                    <span className="text-xl font-semibold">{order.quantite}</span>
                                </td>
                                <td className="py-5 px-4">
                                    <div className="w-12 h-12 border border-gray-300 mx-auto rounded-md"></div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-50 font-semibold border-t-2 border-black">
                        <td className="py-4 px-4 text-right text-lg uppercase">Total Global</td>
                        <td className="py-4 px-4 text-center text-xl">{totalQuantity}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>

            <footer className="mt-auto pt-10 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                Généré par iPOS Point de Vente - {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </footer>
        </div>
    );
});
PrintableList.displayName = 'PrintableList';

export function PrintBreadListDialog({ orders, currentDate }: PrintBreadListDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const profile = useAppStore((state) => state.companyProfile);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printableContent = document.getElementById('receipt-for-print');
        const listElement = printRef.current;

        if (!printableContent || !listElement) return;

        const listClone = listElement.cloneNode(true) as HTMLDivElement;
        listClone.classList.add('a4-receipt');

        printableContent.innerHTML = '';
        printableContent.appendChild(listClone);

        setTimeout(() => window.print(), 100);
    };

    return (
        <>
            <Button variant="outline" onClick={() => setIsOpen(true)} className="rounded-xl h-10 border-primary/20 hover:bg-primary/5 font-bold">
                <Printer className="mr-2 h-4 w-4 text-primary" /> Imprimer Liste
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-sm rounded-3xl">
                    <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground">
                                <Printer className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold tracking-tight">Aperçu Liste de Distribution</DialogTitle>
                                <DialogDescription className="font-medium">Liste simplifiée contenant uniquement les noms et les quantités.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div id="label-print-area-wrapper" className="flex-grow overflow-y-auto bg-muted/50 p-4 custom-scrollbar">
                        <div id="label-print-area" className="bg-white mx-auto shadow-sm" style={{ width: '210mm', minHeight: '297mm' }}>
                            <PrintableList ref={printRef} orders={orders} currentDate={currentDate} profile={profile || null} />
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-card border-t flex gap-3">
                        <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl h-12 font-bold flex-1">
                            <X className="mr-2 h-4 w-4" /> Fermer
                        </Button>
                        <Button onClick={handlePrint} className="rounded-xl h-12 font-bold flex-1 shadow-lg shadow-sm">
                            <Printer className="mr-2 h-4 w-4" /> Imprimer [A4]
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
