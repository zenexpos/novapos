'use client';
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { inventoryService } from '@/services/inventory.service';
import type { Product, InventoryLog } from '@/lib/types';
import { InventoryLogTable } from '../stock/InventoryLogTable';
import { Loader2, History, Package } from 'lucide-react';

interface ProductHistoryDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
}

export function ProductHistoryDialog({ isOpen, onOpenChange, product }: ProductHistoryDialogProps) {
    const [logs, setLogs] = useState<(InventoryLog & { productName: string })[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && product) {
            setIsLoading(true);
            inventoryService.getLogs({ productUuid: product.uuid })
                .then(setLogs)
                .finally(() => setIsLoading(false));
        } else {
            setLogs([]);
        }
    }, [isOpen, product]);

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-sm rounded-3xl">
                <DialogHeader className="bg-primary/5 p-6 border-b border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Historique du Produit</DialogTitle>
                            <DialogDescription className="font-medium flex items-center gap-2 mt-1">
                                <Package className="h-3 w-3" /> {product.name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="font-bold text-sm uppercase tracking-wide">Chargement de l'historique...</p>
                        </div>
                    ) : logs.length > 0 ? (
                        <InventoryLogTable logs={logs} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                            <History className="h-9 w-16 text-muted-foreground/20" />
                            <h3 className="mt-4 text-lg font-bold">Aucun mouvement</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">Ce produit n'a pas encore de transactions enregistrées (ventes, achats, etc.).</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-card border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold w-full sm:w-auto">
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
