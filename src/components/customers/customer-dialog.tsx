'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Customer } from '@/lib/types';
import { Loader2, User, Phone, MapPin, Calendar, ShieldCheck, Coins, Landmark } from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface CustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: Customer | null;
    onSuccess: (customer?: Customer) => void;
}

const initialFormState = {
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    settlementDay: '',
    creditLimit: '',
    initialBalance: '0',
};

export function CustomerDialog({ isOpen, onOpenChange, customer, onSuccess }: CustomerDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (customer && isOpen) {
            setFormState({
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phone || '',
                address: customer.address || '',
                settlementDay: String(customer.settlementDay || ''),
                creditLimit: String(customer.creditLimit || ''),
                initialBalance: String(customer.initialBalance || 0),
            });
        } else {
            setFormState(initialFormState);
        }
    }, [customer, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const onInputFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError(null);
        setIsLoading(true);

        const { firstName, lastName, phone, address, settlementDay, creditLimit, initialBalance } = formState;

        const customerData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
            settlementDay: settlementDay ? parseInt(settlementDay, 10) : undefined,
            creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
            initialBalance: initialBalance ? parseFloat(initialBalance) : 0,
        };

        try {
            if (customer) { // Editing
                const updatedCustomer = await customerService.updateCustomer(customer.uuid, customerData);
                toast.success(`Profil de ${firstName} mis à jour.`);
                onSuccess(updatedCustomer);
            } else { // Adding
                const newCustomer = await customerService.addCustomer(customerData);
                toast.success(`Nouveau client ${firstName} enregistré.`);
                onSuccess(newCustomer);
            }
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
            toast.error("Échec de l'enregistrement.");
        } finally {
            setIsLoading(false);
        }
    };

    useKeyboardShortcuts([
        {
            key: 'Enter',
            ctrl: true,
            action: () => handleSubmit(),
            description: 'Valider le dossier client',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer la fenêtre',
            ignoreInputFocus: true
        }
    ], 'Client', isOpen);

    const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shadow-inner">
                <Icon className="h-3 w-3" />
            </div>
            <h4 className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-widest">{title}</h4>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl rounded-lg border-none shadow-sm p-0 overflow-hidden bg-card">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="bg-primary/5 p-4 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold tracking-tight">
                                    {customer ? 'Édition du Dossier' : 'Inscription Nouveau Client'}
                                </DialogTitle>
                                <DialogDescription className="font-medium text-[10px] uppercase text-primary/40 tracking-wider">Management souverain du fichier Elite</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-xs font-bold border border-destructive/20 text-center">{error}</div>}
                        
                        <div>
                            <SectionTitle title="Identité & Signalétique" icon={User} />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-[10px] font-bold uppercase text-muted-foreground/60 ml-1">Prénom *</Label>
                                    <Input id="firstName" value={formState.firstName} onChange={handleInputChange} onFocus={onInputFocus} className="h-12 rounded-xl bg-muted/20 border-none shadow-inner font-bold text-base" placeholder="Ex: Ahmed" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-[10px] font-bold uppercase text-muted-foreground/60 ml-1">Nom de famille *</Label>
                                    <Input id="lastName" value={formState.lastName} onChange={handleInputChange} onFocus={onInputFocus} className="h-12 rounded-xl bg-muted/20 border-none shadow-inner font-bold text-base" placeholder="Ex: Belkacem" required />
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionTitle title="Canaux de Contact" icon={Phone} />
                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-[10px] font-bold uppercase text-muted-foreground/60 ml-1">Ligne Mobile</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                                        <Input id="phone" type="tel" value={formState.phone} onChange={handleInputChange} onFocus={onInputFocus} className="pl-11 h-12 rounded-xl bg-muted/20 border-none shadow-inner font-mono font-bold" placeholder="0XXXXXXXXX" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-[10px] font-bold uppercase text-muted-foreground/60 ml-1">Adresse Géographique</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                                        <Input id="address" value={formState.address} onChange={handleInputChange} onFocus={onInputFocus} className="pl-11 h-12 rounded-xl bg-muted/20 border-none shadow-inner font-medium" placeholder="Cité, Ville..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionTitle title="Paramètres de Risque & Crédit" icon={ShieldCheck} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/20 rounded-lg border border-white/5 shadow-inner">
                                <div className="space-y-4">
                                    <Label htmlFor="settlementDay" className="text-[10px] font-bold uppercase text-primary ml-1">Jour de règlement</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input id="settlementDay" type="number" min="1" max="31" placeholder="Ex: 30" value={formState.settlementDay} onChange={handleInputChange} onFocus={onInputFocus} className="pl-11 h-9 rounded-2xl bg-background border-none shadow-sm font-black text-xl text-primary text-center" />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground/50 font-medium italic">Échéance mensuelle pour déclencher l'alerte retard.</p>
                                </div>
                                <div className="space-y-4">
                                    <Label htmlFor="creditLimit" className="text-[10px] font-bold uppercase text-muted-foreground/60 ml-1">Plafond de Crédit</Label>
                                    <div className="relative">
                                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                                        <Input id="creditLimit" type="number" placeholder="0.00" value={formState.creditLimit} onChange={handleInputChange} onFocus={onInputFocus} className="pl-11 h-9 rounded-2xl bg-background border-none shadow-sm font-black text-xl text-center" />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground/50 font-medium italic">Limite avant blocage systématique des ventes à crédit.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/10 space-y-4">
                            <SectionTitle title="Report de Dette Historique" icon={Landmark} />
                            <div className="space-y-2">
                                <Label htmlFor="initialBalance" className="text-[10px] font-bold uppercase text-destructive/70 ml-1">Solde Initial (Dette importée)</Label>
                                <div className="relative">
                                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive/30" />
                                    <Input id="initialBalance" type="number" placeholder="0.00" value={formState.initialBalance} onChange={handleInputChange} onFocus={onInputFocus} className="pl-11 h-12 rounded-xl bg-background border-none shadow-inner font-black text-xl text-destructive text-center" />
                                </div>
                                <p className="text-[9px] text-destructive/50 italic text-center">Dette contractée hors système iPOS Zen avant l'ouverture du dossier.</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-card border-t border-white/5 flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-9 rounded-2xl font-bold text-[10px] uppercase tracking-widest px-8" disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading} className="flex-1 h-9 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 gap-3">
                             {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            Valider Dossier [Ctrl+Enter]
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
