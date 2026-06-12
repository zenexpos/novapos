'use client';
import { useState, useEffect } from 'react';
import type { Customer, Sale } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, FileText, Loader2 } from 'lucide-react';
import { CustomerStatement } from './CustomerStatement';
import { Skeleton } from '../ui/skeleton';
import { useAppStore } from '@/stores/appStore';
import { customerService } from '@/services/customer.service';
import { usePrint } from '@/hooks/usePrint';
import { toast } from 'sonner';

interface PrintStatementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customer: Customer | null;
}

export function PrintStatementDialog({ isOpen, onOpenChange, customer }: PrintStatementDialogProps) {
    const profile = useAppStore((state) => state.companyProfile);
    const [statementData, setStatementData] = useState<{ customer: Customer, unpaidSales: Sale[]}| undefined>(undefined);
    const { printElement, isPrinting } = usePrint();
    
    const isLoading = isOpen && statementData === undefined;
    
    useEffect(() => {
        if (!isOpen || !customer) {
            setStatementData(undefined);
            return;
        }

        const fetchStatement = async () => {
            try {
                const data = await customerService.getCustomerStatementData(customer.uuid);
                setStatementData(data);
            } catch (error) {
                toast.error("Impossible de charger les données du relevé de compte.");
            }
        };

        fetchStatement();
    }, [isOpen, customer]);

    const handlePrint = () => {
        if (!customer) return;
        printElement('statement-print-source', {
            title: `Releve_${customer.firstName}_${customer.lastName}`,
            thermal: false
        });
    };
  
    if (!customer) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl h-auto max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-card">
                <DialogHeader className="p-4 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold tracking-tight">Relevé de Compte Client</DialogTitle>
                            <DialogDescription className="text-[10px] font-semibold uppercase text-primary/50">{customer.firstName} {customer.lastName}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="flex-grow overflow-y-auto bg-muted/50 p-8 custom-scrollbar flex justify-center">
                    <div id="statement-print-source" className="bg-white shadow-xl print:shadow-none min-h-[297mm] w-[210mm]">
                        {isLoading ? (
                            <div className="space-y-8 p-12">
                                <div className="flex justify-between"><Skeleton className="h-20 w-48" /><Skeleton className="h-10 w-48" /></div>
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-64 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : statementData ? (
                            <CustomerStatement customer={statementData.customer} unpaidSales={statementData.unpaidSales} profile={profile || null} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-20"><X className="h-12 w-12" /><p>Échec du chargement</p></div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-4 bg-card border-t flex gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 font-bold flex-1">
                        <X className="mr-2 h-4 w-4" /> Fermer
                    </Button>
                    <Button onClick={handlePrint} disabled={isLoading || isPrinting || !statementData} className="rounded-xl h-10 font-bold flex-1 shadow-lg shadow-sm transition-all active:scale-95 gap-2">
                        {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                        Imprimer le Relevé [A4]
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}