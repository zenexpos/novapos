'use client';

import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Users } from 'lucide-react';

interface Props {
    isOpen:       boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm:    () => void;
    isLoading?:   boolean;
    count:        number;
}

export function DeleteMultipleCustomersDialog({ isOpen, onOpenChange, onConfirm, isLoading, count }: Props) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="glass-elevated rounded-2xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-destructive/12 border border-destructive/20 flex items-center justify-center">
                            <Users className="h-4 w-4 text-destructive" />
                        </div>
                        <AlertDialogTitle className="text-base font-black">Supprimer la sélection</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-sm text-muted-foreground/70 leading-relaxed">
                        <span className="font-black text-foreground">{count} élément{count > 1 ? 's' : ''}</span> {count > 1 ? 'seront supprimés' : 'sera supprimé'}.
                        {' '}Cette action supprimera tous les clients sélectionnés de façon permanente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel disabled={isLoading} className="rounded-xl">
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading || count === 0}
                        className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {isLoading ? 'Suppression...' : `Supprimer ${count}`}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
