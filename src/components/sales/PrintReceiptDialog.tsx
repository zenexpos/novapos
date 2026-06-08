'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from './Receipt';
import { Printer, X, FileText, Smartphone, MessageCircle, Loader2, Download } from 'lucide-react';
import type { Sale, Customer } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface PrintReceiptDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
    customerName?: string;
}

export function PrintReceiptDialog({
    isOpen,
    onOpenChange,
    sale,
    customerName,
}: PrintReceiptDialogProps) {
    const profile = useAppStore(state => state.companyProfile);
    const [receiptType, setReceiptType] = useState<'a4' | 'thermal'>('a4'); 
    const [isGenerating, setIsGenerating] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    
    const oldBalance = useMemo(() => {
        if (!customer || !sale) return 0;
        const currentDebtOfThisSale = Math.max(0, sale.total - sale.amountPaid);
        const balanceBeforeThisSale = (customer.outstandingBalance || 0) - currentDebtOfThisSale;
        return Math.max(0, balanceBeforeThisSale);
    }, [customer, sale]);

    useEffect(() => {
        if (isOpen && sale?.customerUuid) {
            customerService.getCustomerByUuid(sale.customerUuid)
                .then(c => {
                    if (c) setCustomer(c);
                })
                .catch(() => console.warn("Echec recuperation client"));
        } else {
            setCustomer(null);
        }
    }, [isOpen, sale]);

    const resolvedCustomerName = useMemo(() => {
        if (customer) return `${customer.firstName} ${customer.lastName}`;
        if (customerName && customerName !== 'Client de passage') return customerName;
        return 'Client de passage';
    }, [customer, customerName]);

    const handlePrint = useCallback(() => {
        if (!sale) return;
        
        const printablePortal = document.getElementById('receipt-for-print');
        const sourceElement = document.getElementById('receipt-render-target-inner');

        if (!printablePortal || !sourceElement) {
            toast.error("Erreur : Canal de sortie introuvable.");
            return;
        }

        const clone = sourceElement.cloneNode(true) as HTMLDivElement;
        clone.style.transform = 'none';
        clone.style.margin = '0';
        clone.style.position = 'relative';
        clone.style.width = receiptType === 'a4' ? '210mm' : '80mm';
        
        printablePortal.innerHTML = '';
        printablePortal.appendChild(clone);

        setTimeout(() => {
            window.print();
        }, 300);
    }, [sale, receiptType]);

    useKeyboardShortcuts([
        {
            key: 'p',
            action: handlePrint,
            description: 'Imprimer le document',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer la fenetre',
            ignoreInputFocus: true
        }
    ], 'Impression', isOpen);

    const handleGeneratePDF = useCallback(async (isShare: boolean) => {
        if (!sale) return;
        setIsGenerating(true);

        try {
            // Fix: using standard import with fallback types
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            const element = document.getElementById('receipt-render-target-inner');
            if (!element) throw new Error("Source de rendu introuvable");

            const canvas = await html2canvas(element, {
                scale: 2, 
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdfWidth = receiptType === 'a4' ? 210 : 80;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            
            const fileName = `Facture_${sale.invoiceNumber}.pdf`;

            if (isShare && typeof navigator !== 'undefined' && navigator.share) {
                const pdfBlob = pdf.output('blob');
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                
                try {
                    await navigator.share({
                        files: [file],
                        title: `Facture #${sale.invoiceNumber}`,
                        text: `Bonjour, voici votre facture #${sale.invoiceNumber} de l'établissement ${profile?.companyName || 'iPOS'}. Cordialement.`
                    });
                    toast.success("Partage effectue avec succes.");
                } catch (e: any) {
                    if (e.name !== 'AbortError') {
                        pdf.save(fileName);
                        toast.info("Partage indisponible. Fichier telecharge.");
                    }
                }
            } else {
                pdf.save(fileName);
                toast.success("Exportation PDF terminee.");
            }
        } catch (error: any) {
            console.error("PDF Generation Error:", error);
            toast.error("Erreur de generation du document HD. Veuillez reessayer.");
        } finally {
            setIsGenerating(false);
        }
    }, [sale, receiptType, profile?.companyName]);

    if (!sale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-auto max-h-[95vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-card">
                <DialogHeader className="p-4 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold tracking-tight">Gestion Documentaire Elite</DialogTitle>
                                <DialogDescription className="text-[10px] uppercase font-semibold text-primary/50">Facture : #{sale.invoiceNumber}</DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-background p-1.5 rounded-xl border border-primary/10">
                            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all", receiptType === 'thermal' ? "bg-primary text-primary-foreground shadow-sm" : "opacity-40")}>
                                <Smartphone className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase">Ticket</span>
                            </div>
                            <Switch
                                checked={receiptType === 'a4'}
                                onCheckedChange={v => setReceiptType(v ? 'a4' : 'thermal')}
                            />
                            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all", receiptType === 'a4' ? "bg-primary text-primary-foreground shadow-sm" : "opacity-40")}>
                                <FileText className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase">A4</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto bg-muted p-6 custom-scrollbar flex justify-center">
                    <div 
                        id="receipt-render-target"
                        className={cn(
                            "transition-all origin-top h-auto", 
                            receiptType === 'a4' ? "scale-[0.7] sm:scale-[0.85] lg:scale-100" : "scale-100"
                        )} 
                    >
                        <div id="receipt-render-target-inner" className="bg-white shadow-2xl">
                            <Receipt 
                                sale={sale} 
                                profile={profile} 
                                receiptType={receiptType} 
                                customerName={resolvedCustomerName} 
                                oldBalance={oldBalance}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-card border-t flex flex-wrap gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-11 font-bold px-6">
                        <X className="mr-2 h-4 w-4" /> Fermer
                    </Button>
                    
                    <Button 
                        variant="outline"
                        onClick={() => handleGeneratePDF(true)} 
                        disabled={isGenerating}
                        className="rounded-xl h-11 font-bold border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all gap-2"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                        Partager WhatsApp
                    </Button>

                    <Button 
                        variant="outline"
                        onClick={() => handleGeneratePDF(false)} 
                        disabled={isGenerating}
                        className="rounded-xl h-11 font-bold border-primary/20 hover:bg-primary/5 transition-all gap-2"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Exporter PDF
                    </Button>

                    <Button onClick={handlePrint} className="rounded-xl h-11 font-black text-xs uppercase tracking-widest flex-1 shadow-xl transition-all active:scale-95 gap-3">
                        <Printer className="h-5 w-5" /> 
                        Imprimer [P]
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
