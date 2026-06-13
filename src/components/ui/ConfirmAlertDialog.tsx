'use client';
import React from 'react';

import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface ConfirmAlertDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    title: string;
    description: React.ReactNode;
    onConfirm: () => Promise<void>;
    confirmText?: string;
    cancelText?: string;
}

/**
 * UI RESPONSE OPTIMIZATION (FORENSIC FIX).
 * The dialog is signaled to close BEFORE starting heavy background mutations.
 * This releases the Radix body scroll lock and prevents "Interaction Freeze" during heavy CPU tasks.
 */
export function ConfirmAlertDialog({ 
    isOpen, 
    onOpenChange, 
    title, 
    description,
    onConfirm,
    confirmText = "Continuer",
    cancelText = "Annuler"
}: ConfirmAlertDialogProps) {
    const [isMutating, setIsMutating] = useState(false);

    const handleConfirm = async () => {
        setIsMutating(true);
        try {
            // 1. Signal immediate closure to unlock pointer events and scrolling
            onOpenChange(false);
            
            // 2. Minimal delay to let Radix finish its internal DOM cleanup cycle
            setTimeout(async () => {
                try {
                    await onConfirm();
                } catch (error: any) {
                    toast.error(error.message || "L'opération a échoué.");
                }
            }, 10);
        } catch (error: any) {
            toast.error(error.message || "Erreur de transition.");
        } finally {
            setIsMutating(false);
        }
    };

    useKeyboardShortcuts([
        {
            key: 'Enter',
            action: handleConfirm,
            description: 'Confirmer l\'action',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Annuler',
            ignoreInputFocus: true
        }
    ], 'Confirmation', isOpen);

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !isMutating && onOpenChange(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="pt-2">{description}</div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isMutating}>{cancelText}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm} disabled={isMutating}
                className={cn(buttonVariants({ variant: "destructive" }))} >
                 {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {confirmText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    );
}