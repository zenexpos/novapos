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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BREAD_WEEK_DAY_LABELS_FULL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// ─── État initial propre ───────────────────────────────────────
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
    bread_type_recurrence: 'quotidien',
    bread_quantite_defaut: 10,
    bread_jours_semaine:   defaultJoursSemaine,
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
                bread_type_recurrence: customer.bread_type_recurrence || 'aucun',
                bread_quantite_defaut: customer.bread_quantite_defaut || 10,
                bread_jours_semaine:
                    customer.bread_jours_semaine || defaultJoursSemaine,
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
                    bread_type_recurrence: formState.bread_type_recurrence,
                };

                if (formState.bread_type_recurrence === 'quotidien') {
                    dataToSave.bread_quantite_defaut = formState.bread_quantite_defaut;
                    dataToSave.bread_jours_semaine = undefined;
                } else if (formState.bread_type_recurrence === 'jours_specifiques') {
                    dataToSave.bread_jours_semaine = formState.bread_jours_semaine;
                    dataToSave.bread_quantite_defaut = 0;
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
            bread_jours_semaine: {
                ...prev.bread_jours_semaine!,
                [day]: {
                    ...prev.bread_jours_semaine![day],
                    actif: !prev.bread_jours_semaine![day].actif,
                },
            },
        }));
    };

    const handleDayQuantityChange = (day: string, value: string) => {
        const quantite = parseFloat(value) || 0;
        setFormState(prev => ({
            ...prev,
            bread_jours_semaine: {
                ...prev.bread_jours_semaine!,
                [day]: { ...prev.bread_jours_semaine![day], quantite },
            },
        }));
    };

    // Raccourcis pour le formulaire d'abonnement
    useKeyboardShortcuts([
        {
            key: 'Enter',
            ctrl: true,
            action: () => handleSubmit(),
            description: 'Enregistrer l\'abonnement',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer',
            ignoreInputFocus: true
        }
    ], 'AbonnementPain', isOpen);

    if (!customer) return null;

    const SectionTitle = ({
        title,
        icon: Icon,
    }: {
        title: string;
        icon: any;
    }) => (
        <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Icon className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {title}
            </h4>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="bg-primary/5 p-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                                <Wheat className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Programme Pain
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Commandes récurrentes pour {customer.firstName} {customer.lastName}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-4">
                            <SectionTitle title="Abonnement & Fréquence" icon={Settings} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">Statut du programme</Label>
                                    <div className={cn(
                                        'flex items-center justify-between p-3 rounded-lg border transition-colors',
                                        formState.isBreadClient ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-border',
                                    )}>
                                        <span className={cn('text-xs font-bold uppercase', formState.isBreadClient ? 'text-emerald-600' : 'text-muted-foreground')}>
                                            {formState.isBreadClient ? 'ACTIF' : 'INACTIF'}
                                        </span>
                                        <Switch
                                            checked={formState.isBreadClient}
                                            onCheckedChange={checked => setFormState(s => ({ ...s, isBreadClient: checked }))}
                                            className="data-[state=checked]:bg-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">Fréquence</Label>
                                    <Select
                                        value={formState.bread_type_recurrence}
                                        onValueChange={value => setFormState(s => ({
                                            ...s,
                                            bread_type_recurrence: value as any,
                                            bread_quantite_defaut: 0,
                                            bread_jours_semaine:   defaultJoursSemaine,
                                        }))}
                                    >
                                        <SelectTrigger className="h-9 font-semibold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="quotidien">Quotidien (quantité fixe)</SelectItem>
                                            <SelectItem value="jours_specifiques">Jours spécifiques (calendrier)</SelectItem>
                                            <SelectItem value="aucun">Manuel (à la demande)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {formState.bread_type_recurrence === 'quotidien' && (
                            <div className="p-4 rounded-lg border border-primary/15 bg-primary/5 animate-in fade-in duration-200">
                                <SectionTitle title="Quantité fixe par jour" icon={Package} />
                                <div className="flex items-center justify-center gap-3">
                                    <Label className="text-sm">Quantité:</Label>
                                    <div className="relative w-32">
                                        <Input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            value={formState.bread_quantite_defaut}
                                            onChange={e => setFormState(s => ({
                                                ...s,
                                                bread_quantite_defaut: parseFloat(e.target.value) || 0,
                                            }))}
                                            className="h-10 text-center font-bold text-lg"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-40 uppercase">pcs</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {formState.bread_type_recurrence === 'jours_specifiques' && (
                            <div className="p-4 rounded-lg border border-border bg-muted/10 animate-in fade-in duration-200">
                                <SectionTitle title="Calendrier hebdomadaire" icon={Calendar} />
                                <div className="space-y-2">
                                    {Object.entries(BREAD_WEEK_DAY_LABELS_FULL).map(([key, label]) => {
                                        const dayData = formState.bread_jours_semaine?.[key] || { actif: false, quantite: 0 };
                                        return (
                                            <div key={key} className={cn(
                                                'flex items-center gap-3 p-2.5 rounded-lg border transition-opacity',
                                                dayData.actif ? 'bg-card border-border' : 'opacity-40 border-transparent',
                                            )}>
                                                <Switch
                                                    checked={dayData.actif}
                                                    onCheckedChange={() => handleDayToggle(key)}
                                                    className="data-[state=checked]:bg-primary"
                                                />
                                                <Label className="flex-1 text-xs font-semibold uppercase tracking-wide">{label}</Label>
                                                <div className="relative w-24">
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        className="h-8 text-center text-sm font-bold"
                                                        value={dayData.quantite}
                                                        onChange={e => handleDayQuantityChange(key, e.target.value)}
                                                        disabled={!dayData.actif}
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] opacity-30 uppercase">pcs</span>
                                                </div>
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