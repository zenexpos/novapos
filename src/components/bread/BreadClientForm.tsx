'use client';
import React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { Button }   from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { toast }  from 'sonner';
import type { Customer } from '@/lib/types';
import {
    Loader2, Wheat, Settings, Calendar,
    Package, CheckCircle2,
} from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { Switch } from '@/components/ui/switch';
import { BREAD_WEEK_DAY_LABELS_FULL } from '@/lib/constants';
import { cn, formatDateToYYYYMMDD } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const defaultJoursSemaine = {
    lundi:    { actif: true,  quantite: 10 },
    mardi:    { actif: true,  quantite: 10 },
    mercredi: { actif: true,  quantite: 10 },
    jeudi:    { actif: true,  quantite: 10 },
    vendredi: { actif: false, quantite: 0  },
    samedi:   { actif: true,  quantite: 10 },
    dimanche: { actif: true,  quantite: 10 },
};

const initialFormState: Partial<Customer> = {
    isBreadClient:         true,
    breadRecurrenceType: 'quotidien',
    breadDefaultQuantity: 10,
    breadWeeklySchedule:   defaultJoursSemaine,
};

interface BreadClientFormProps {
    isOpen:       boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer:     Customer | null;
    onSuccess:    () => void;
}

export function BreadClientForm({
    isOpen,
    onOpenChange,
    customer,
    onSuccess,
}: BreadClientFormProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        if (customer) {
            setFormState({
                isBreadClient:         customer.isBreadClient ?? true,
                breadRecurrenceType: customer.breadRecurrenceType || 'aucun',
                breadDefaultQuantity: customer.breadDefaultQuantity || 10,
                breadWeeklySchedule: customer.breadWeeklySchedule || defaultJoursSemaine,
                breadStartDate:      customer.breadStartDate,
            });
        } else {
            setFormState(initialFormState);
        }
    }, [customer, isOpen]);

    const handleSubmit = useCallback(
        async (e?: React.FormEvent) => {
            e?.preventDefault();
            if (!customer?.uuid) return;

            setIsLoading(true);
            try {
                const dataToSave: Partial<Customer> = {
                    isBreadClient:         formState.isBreadClient,
                    breadRecurrenceType: formState.breadRecurrenceType,
                    breadStartDate:      formState.breadStartDate || (formState.isBreadClient ? formatDateToYYYYMMDD(new Date()) : undefined)
                };

                if (formState.breadRecurrenceType === 'quotidien') {
                    dataToSave.breadDefaultQuantity = formState.breadDefaultQuantity;
                    dataToSave.breadWeeklySchedule = undefined;
                } else if (formState.breadRecurrenceType === 'jours_specifiques') {
                    dataToSave.breadWeeklySchedule = formState.breadWeeklySchedule;
                    dataToSave.breadDefaultQuantity = 0;
                }

                await customerService.updateCustomer(customer.uuid, dataToSave);
                toast.success(`Programme pain mis à jour pour ${customer.firstName}.`);
                onSuccess();
                onOpenChange(false);
            } catch {
                toast.error('Échec de la mise à jour.');
            } finally {
                setIsLoading(false);
            }
        },
        [formState, customer, onOpenChange, onSuccess],
    );

    const handleDayToggle = (day: string) => {
        setFormState(prev => ({
            ...prev,
            breadWeeklySchedule: {
                ...prev.breadWeeklySchedule!,
                [day]: {
                    ...prev.breadWeeklySchedule![day],
                    actif: !prev.breadWeeklySchedule![day].actif,
                },
            },
        }));
    };

    const handleDayQuantityChange = (day: string, value: string) => {
        const quantite = parseFloat(value) || 0;
        setFormState(prev => ({
            ...prev,
            breadWeeklySchedule: {
                ...prev.breadWeeklySchedule!,
                [day]: { ...prev.breadWeeklySchedule![day], quantite },
            },
        }));
    };

    useKeyboardShortcuts([
        { key: 'Enter', ctrl: true, action: () => handleSubmit(), description: 'Enregistrer', ignoreInputFocus: true },
        { key: 'Escape', action: () => onOpenChange(false), description: 'Fermer', ignoreInputFocus: true }
    ], 'AbonnementPain', isOpen);

    if (!customer) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="bg-primary/5 p-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary text-primary-foreground"><Wheat className="h-5 w-5" /></div>
                            <div>
                                <DialogTitle className="text-base font-semibold">Programme Pain Elite</DialogTitle>
                                <DialogDescription className="text-xs">Commandes pour {customer.firstName} {customer.lastName}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">Statut</Label>
                                    <div className={cn('flex items-center justify-between p-3 rounded-lg border', formState.isBreadClient ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-border')}>
                                        <span className={cn('text-xs font-bold uppercase', formState.isBreadClient ? 'text-emerald-600' : 'text-muted-foreground')}>
                                            {formState.isBreadClient ? 'ACTIF' : 'INACTIF'}
                                        </span>
                                        <Switch checked={formState.isBreadClient} onCheckedChange={checked => setFormState(s => ({ ...s, isBreadClient: checked }))} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">Fréquence</Label>
                                    <select value={formState.breadRecurrenceType} onChange={e => setFormState(s => ({ ...s, breadRecurrenceType: e.target.value as any }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                                        <option value="quotidien">Quotidien</option>
                                        <option value="jours_specifiques">Programmé</option>
                                        <option value="aucun">Manuel</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {formState.breadRecurrenceType === 'quotidien' && (
                            <div className="p-4 rounded-lg border border-primary/15 bg-primary/5">
                                <Label className="text-sm">Quantité fixe:</Label>
                                <Input type="number" step="0.5" value={formState.breadDefaultQuantity} onChange={e => setFormState(s => ({ ...s, breadDefaultQuantity: parseFloat(e.target.value) || 0 }))} className="h-10 text-center font-bold text-lg mt-2" />
                            </div>
                        )}

                        {formState.breadRecurrenceType === 'jours_specifiques' && (
                            <div className="p-4 rounded-lg border border-border bg-muted/10">
                                <div className="space-y-2">
                                    {Object.entries(BREAD_WEEK_DAY_LABELS_FULL).map(([key, label]) => {
                                        const dayData = formState.breadWeeklySchedule?.[key] || { actif: false, quantite: 0 };
                                        return (
                                            <div key={key} className={cn('flex items-center gap-3 p-2.5 rounded-lg border', dayData.actif ? 'bg-card border-border' : 'opacity-40 border-transparent')}>
                                                <Switch checked={dayData.actif} onCheckedChange={() => handleDayToggle(key)} />
                                                <Label className="flex-1 text-xs font-semibold uppercase tracking-wide">{label}</Label>
                                                <Input type="number" step="0.5" className="h-8 w-24 text-center font-bold" value={dayData.quantite} onChange={e => handleDayQuantityChange(key, e.target.value)} disabled={!dayData.actif} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 border-t border-border flex gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" className="flex-1" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Enregistrer [Ctrl+Enter]
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
