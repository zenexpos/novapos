'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Wallet, History } from 'lucide-react';
import type { Supplier } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface SupplierMetricsProps {
    supplier: Supplier;
    totalPurchases: number;
}

export function SupplierMetrics({ supplier, totalPurchases }: SupplierMetricsProps) {
    return (
        <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-primary/70">Résumé Financier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">Matière Achetée</p>
                            <p className="text-xl font-semibold">{formatCurrency(totalPurchases)}</p>
                        </div>
                    </div>
                </div>

                 <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-2xl border border-destructive/10 group hover:border-destructive/20 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                            <Landmark className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase text-destructive/70 tracking-wide">Dette à Régler</p>
                            <p className="text-lg font-semibold text-destructive">{formatCurrency(supplier.balance)}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/10 border border-dashed border-border/50 text-[10px] text-muted-foreground italic">
                    * Les dettes sont mises à jour automatiquement lors de la réception de nouvelles factures d'achat ou de l'enregistrement de paiements.
                </div>
            </CardContent>
        </Card>
    );
}
