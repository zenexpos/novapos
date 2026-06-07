'use client';

import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    isOpen:        boolean;
    onOpenChange:  (open: boolean) => void;
    onConfirm:     () => void;
    isLoading?:    boolean;
    name?:         string;
}

export function DeleteProductDialog({ isOpen, onOpenChange, onConfirm, isLoading, name }: Props) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="glass-elevated rounded-2xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-destructive/12 border border-destructive/20 flex items-center justify-center">
                            <Package className="h-4 w-4 text-destructive" />
                        </div>
                        <AlertDialogTitle className="text-base font-black">Supprimer le produit</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-sm text-muted-foreground/70 leading-relaxed">
                        {name && <><span className="font-black text-foreground">{name}</span> — </>}
                        Cette action supprimera le produit et ses données de stock.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel
                        disabled={isLoading}
                        className="rounded-xl"
                    >
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {isLoading ? 'Suppression...' : 'Supprimer'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
