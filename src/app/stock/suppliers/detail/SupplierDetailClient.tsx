'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { SupplierMetrics } from '@/components/stock/SupplierMetrics';
import { SupplierActivity } from '@/components/stock/SupplierActivity';
import { SupplierPaymentDialog } from '@/components/stock/SupplierPaymentDialog';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';
import type { StockIntake, Supplier } from '@/lib/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { supplierService } from '@/services/supplier.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SupplierDetailClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supplierUuid = searchParams.get('uuid');

    const [supplier, setSupplier] = useState<Supplier | undefined | null>(undefined);
    const [activity, setActivity] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [isIntakeDetailsOpen, setIsIntakeDetailsOpen] = useState(false);

    const fetchSupplierData = useCallback(async () => {
        if (!supplierUuid) {
            router.push('/stock');
            return;
        }
        setIsLoading(true);
        try {
            const [sup, act] = await Promise.all([
                supplierService.getSupplierByUuid(supplierUuid),
                supplierService.getSupplierActivity(supplierUuid)
            ]);
            setSupplier(sup);
            setActivity(act);
            if (!sup) {
                toast.error("Fournisseur non trouvé.");
                router.push('/stock');
            }
        } catch (error: any) {
            toast.error("Impossible de charger les données.", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [supplierUuid, router]);
    
    useEffect(() => {
        fetchSupplierData();
    }, [fetchSupplierData]);

    const totalPurchases = useMemo(() => {
        return activity
            .filter(a => a.type === 'intake')
            .reduce((sum, i) => sum + (i.totalValue || 0), 0);
    }, [activity]);

    const handleIntakeClick = useCallback((intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsIntakeDetailsOpen(true);
    }, []);

    if (isLoading && !supplier) {
        return (
             <div className="p-4 sm:p-6 space-y-6 max-w-[1800px] mx-auto">
                <Skeleton className="h-8 w-48 rounded-xl" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-[500px] w-full rounded-3xl" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-60 w-full rounded-3xl" />
                         <Skeleton className="h-9 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!supplier) return null;

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1800px] mx-auto">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" className="rounded-xl border-none shadow-sm bg-card h-10 w-10" asChild>
                    <Link href="/stock"><ArrowLeft className="h-4 w-4" /></Link>
                 </Button>
                 <PageHeader 
                    title={supplier.name}
                    description={`ID Fournisseur: ${supplier.uuid.substring(0,8)}...`}
                 />
                 <Button variant="outline" size="icon" onClick={fetchSupplierData} className="ml-auto rounded-xl border-none shadow-sm bg-card h-10 w-10">
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                 </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2">
                     <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50">
                            <CardTitle className="text-xl font-semibold tracking-tight">Historique d'activité</CardTitle>
                            <CardDescription className="font-medium">
                                Liste chronologique des achats et des règlements financiers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <SupplierActivity 
                                activity={activity} 
                                onIntakeClick={handleIntakeClick}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6 sticky top-24">
                    <SupplierMetrics supplier={supplier} totalPurchases={totalPurchases} />
                    
                    <Button 
                        size="lg" 
                        className="w-full rounded-2xl h-9 font-semibold shadow-lg text-lg gap-3"
                        onClick={() => setIsPayDialogOpen(true)}
                        disabled={supplier.balance <= 0}
                    >
                        <HandCoins className="h-6 w-6" /> Verser un paiement
                    </Button>

                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">Contact Fournisseur</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Responsable:</span> <span className="font-bold">{supplier.contactPerson || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Téléphone:</span> <span className="font-bold">{supplier.phone || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Email:</span> <span className="font-bold">{supplier.email || '-'}</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <SupplierPaymentDialog 
                isOpen={isPayDialogOpen}
                onOpenChange={setIsPayDialogOpen}
                supplier={supplier}
                onSuccess={fetchSupplierData}
            />

            <StockIntakeDetailsDialog
                isOpen={isIntakeDetailsOpen}
                onOpenChange={setIsIntakeDetailsOpen}
                intake={selectedIntake}
                supplierName={supplier.name}
            />
        </div>
    );
}
