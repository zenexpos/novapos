'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Customer, CustomerFormData } from '@/lib/types';
import { Loader2, User, Phone, Landmark, ShieldCheck, Info } from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: Customer | null;
    onSuccess: (customer?: Customer) => void;
}

const initialFormState: CustomerFormData = {
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    settlementDay: undefined,
    creditLimit: undefined,
    initialBalance: 0,
    isBreadClient: false
};

export function CustomerDialog({ isOpen, onOpenChange, customer, onSuccess }: CustomerDialogProps) {
    const [formState, setFormState] = useState<CustomerFormData>(initialFormState);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (customer && isOpen) {
            setFormState({
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phone || '',
                address: customer.address || '',
                settlementDay: customer.settlementDay,
                creditLimit: customer.creditLimit,
                initialBalance: customer.initialBalance || 0,
                isBreadClient: customer.isBreadClient || false
            });
        } else if (!customer && isOpen) {
            setFormState(initialFormState);
        }
    }, [customer, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormState(prev => ({ 
            ...prev, 
            [id]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value 
        }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (customer) {
                await customerService.updateCustomer(customer.uuid, formState);
                toast.success(`Profil de ${formState.firstName} mis à jour.`);
                onOpenChange(false);
                onSuccess();
            } else {
                await customerService.addCustomer(formState);
                toast.success(`Nouveau client ${formState.firstName} enregistré.`);
                onOpenChange(false);
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
            toast.error("Échec de l'enregistrement.");
        } finally {
            setIsLoading(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'Enter', ctrl: true, action: () => handleSubmit(), description: 'Enregistrer le client', ignoreInputFocus: true }
    ], 'CustomerDialog', isOpen);

    const SectionTitle = ({ title, icon: Icon, tooltip }: { title: string, icon: any, tooltip?: string }) => (
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shadow-inner">
                <Icon className="h-3 w-3" />
            </div>
            <h4 className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-widest">{title}</h4>
            {tooltip && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground/40 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px] text-center">{tooltip}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-card">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="bg-primary/5 p-6 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight">
                                    {customer ? 'Édition du Client' : 'Nouveau Dossier Client'}
                                </DialogTitle>
                                <DialogDescription className="font-bold text-[10px] uppercase text-primary/40 tracking-wider">Identité et paramètres financiers</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-xs font-bold border border-destructive/20 text-center">{error}</div>}
                        
                        <div>
                            <SectionTitle title="Identité Personnelle" icon={User} />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-[10px] font-bold uppercase text-muted-foreground/60 ml-1">Prénom *</Label>
                                    <Input id="firstName" value={formState.firstName} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold text-base" placeholder="Ex: Ahmed" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-[10px] font-bold uppercase text-muted-foreground/60 ml-1">Nom *</Label>
                                    <Input id="lastName" value={formState.lastName} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold text-base" placeholder="Ex: Benali" required />
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionTitle 
                                title="Crédit & Échéances" 
                                icon={ShieldCheck} 
                                tooltip="Définissez ici les limites de confiance pour ce client."
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-muted/20 rounded-2xl border border-white/5 shadow-inner">
                                <div className="space-y-3">
                                    <Label htmlFor="settlementDay" className="text-[10px] font-bold uppercase text-primary ml-1">Jour de règlement</Label>
                                    <Input id="settlementDay" type="number" min="1" max="31" placeholder="Ex: 30" value={formState.settlementDay || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-background border-none shadow-sm font-black text-xl text-primary text-center" />
                                    <p className="text-[9px] text-muted-foreground/60 italic leading-tight">Le jour du mois où le client doit solder sa dette (Relance auto).</p>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="creditLimit" className="text-[10px] font-bold uppercase text-muted-foreground/60 ml-1">Plafond de Crédit (DA)</Label>
                                    <Input id="creditLimit" type="number" placeholder="Illimité" value={formState.creditLimit || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-background border-none shadow-sm font-black text-xl text-center" />
                                    <p className="text-[9px] text-muted-foreground/60 italic leading-tight">Montant maximal de dette autorisé pour ce client.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-destructive/5 rounded-2xl border border-destructive/10 space-y-4">
                            <SectionTitle 
                                title="Situation Antérieure" 
                                icon={Landmark} 
                                tooltip="Le montant que le client vous doit AVANT l'utilisation de ce logiciel."
                            />
                            <div className="space-y-2">
                                <Label htmlFor="initialBalance" className="text-[10px] font-bold uppercase text-destructive/70 ml-1">Dette de départ (Report de solde)</Label>
                                <Input id="initialBalance" type="number" placeholder="0.00 DA" value={formState.initialBalance || ''} onChange={handleInputChange} className="h-14 rounded-xl bg-background border-none shadow-inner font-black text-2xl text-destructive text-center" />
                                <p className="text-[10px] text-destructive/50 italic text-center font-bold">ATTENTION : Ce montant sera ajouté à la dette totale du client.</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-card border-t border-white/5 flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest px-8">Annuler</Button>
                        <Button type="submit" disabled={isLoading} className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 gap-3">
                             {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                            Confirmer le Dossier
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}