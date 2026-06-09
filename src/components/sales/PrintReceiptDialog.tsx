'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from './Receipt';
import { Printer, X, FileText, Smartphone, MessageCircle, Loader2, Download, Share2 } from 'lucide-react';
import type { Sale, Customer } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { customerService } from '@/services/customer.service';
import { usePrint } from '@/hooks/usePrint';
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
    const { printElement, isPrinting } = usePrint();
    
    // حساب الرصيد السابق للعميل لظهوره في الفاتورة (قبل هذه البيعة)
    const oldBalance = useMemo(() => {
        if (!customer || !sale) return 0;
        // الرصيد الحالي للعميل يتضمن بالفعل هذه البيعة (تم تحديثه في الداتابيز)
        // لذا نطرح منها المبلغ المتبقي من هذه الفاتورة لنحصل على الرصيد القديم
        const currentDebtOfThisSale = Math.max(0, sale.total - sale.amountPaid);
        const balanceBeforeThisSale = (customer.outstandingBalance || 0) - currentDebtOfThisSale;
        return Math.max(0, balanceBeforeThisSale);
    }, [customer, sale]);

    useEffect(() => {
        if (isOpen && sale?.customerUuid) {
            customerService.getCustomerByUuid(sale.customerUuid)
                .then(c => { if (c) setCustomer(c); })
                .catch(() => console.warn("Echec recuperation client"));
        } else {
            setCustomer(null);
        }
        
        // ذكاء اصطناعي: اختيار نوع الورق بناء على تفضيلات سابقة أو طول الفاتورة
        if (isOpen && sale) {
            const isLongSale = sale.items.length > 10;
            setReceiptType(isLongSale ? 'a4' : 'thermal');
        }
    }, [isOpen, sale]);

    const resolvedCustomerName = useMemo(() => {
        if (customer) return `${customer.firstName} ${customer.lastName}`;
        if (customerName && customerName !== 'Client de passage') return customerName;
        return 'Client de passage';
    }, [customer, customerName]);

    const handlePrint = useCallback(() => {
        if (!sale) return;
        printElement('receipt-render-target-inner', {
            title: `Facture_${sale.invoiceNumber}`,
            thermal: receiptType === 'thermal'
        });
    }, [sale, receiptType, printElement]);

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
            description: 'Fermer la fenêtre',
            ignoreInputFocus: true
        }
    ], 'Impression', isOpen);

    const handleGeneratePDF = useCallback(async (isShare: boolean) => {
        if (!sale) return;
        setIsGenerating(true);

        try {
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            const element = document.getElementById('receipt-render-target-inner');
            if (!element) throw new Error("Source de rendu introuvable");

            const canvas = await html2canvas(element, {
                scale: 3, // دقة عالية جداً للطباعة والمشاركة
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
                    toast.success("Partage effectué avec succès.");
                } catch (e: any) {
                    if (e.name !== 'AbortError') {
                        pdf.save(fileName);
                        toast.info("Partage indisponible. Fichier téléchargé.");
                    }
                }
            } else {
                pdf.save(fileName);
                toast.success("Exportation PDF terminée.");
            }
        } catch (error: any) {
            console.error("PDF Generation Error:", error);
            toast.error("Erreur de génération du document HD. Veuillez réessayer.");
        } finally {
            setIsGenerating(false);
        }
    }, [sale, receiptType, profile?.companyName]);

    if (!sale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl h-auto max-h-[95vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight">Poste de Sortie Documentaire</DialogTitle>
                                <DialogDescription className="text-[10px] uppercase font-bold text-primary/40 tracking-widest mt-1">Facture de Livraison : #{sale.invoiceNumber}</DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-background/50 backdrop-blur-md p-2 rounded-2xl border border-primary/10 shadow-inner">
                            <div className={cn("flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-500", receiptType === 'thermal' ? "bg-primary text-primary-foreground shadow-lg scale-105" : "opacity-30")}>
                                <Smartphone className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Ticket 80mm</span>
                            </div>
                            <Switch
                                checked={receiptType === 'a4'}
                                onCheckedChange={v => setReceiptType(v ? 'a4' : 'thermal')}
                                className="data-[state=checked]:bg-primary"
                            />
                            <div className={cn("flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-500", receiptType === 'a4' ? "bg-primary text-primary-foreground shadow-lg scale-105" : "opacity-30")}>
                                <FileText className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Format A4</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto bg-muted/30 p-8 custom-scrollbar flex justify-center">
                    <div 
                        id="receipt-render-target"
                        className={cn(
                            "transition-all duration-700 origin-top h-auto mb-20", 
                            receiptType === 'a4' ? "scale-[0.8] sm:scale-[0.9] lg:scale-100" : "scale-100"
                        )} 
                    >
                        <div id="receipt-render-target-inner" className="bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden">
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

                <DialogFooter className="p-6 bg-card border-t border-white/5 flex flex-wrap gap-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-12 font-black text-[10px] uppercase tracking-widest px-8">
                        <X className="mr-2 h-4 w-4" /> Annuler
                    </Button>
                    
                    <div className="flex-grow" />

                    <div className="flex gap-3">
                        <Button 
                            variant="outline"
                            onClick={() => handleGeneratePDF(false)} 
                            disabled={isGenerating}
                            className="rounded-2xl h-12 font-bold border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all gap-3 px-6"
                        >
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            <span className="text-[10px] font-black uppercase">Exporter PDF</span>
                        </Button>

                        <Button 
                            variant="outline"
                            onClick={() => handleGeneratePDF(true)} 
                            disabled={isGenerating}
                            className="rounded-2xl h-12 font-bold border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all gap-3 px-6"
                        >
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase">Partager WhatsApp</span>
                        </Button>

                        <Button onClick={handlePrint} disabled={isPrinting} className="rounded-2xl h-12 font-black text-xs uppercase tracking-[0.2em] px-12 shadow-2xl transition-all active:scale-95 gap-3">
                            {isPrinting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />} 
                            Imprimer [P]
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}