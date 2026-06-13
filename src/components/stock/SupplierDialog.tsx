'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Supplier } from '@/lib/types';
import { Loader2, Building, Phone, Mail, MapPin, User } from 'lucide-react';
import { supplierService } from '@/services/supplier.service';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface SupplierDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    supplier: Supplier | null;
    onSuccess: () => void;
}

const initialFormState = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
};

export function SupplierDialog({ isOpen, onOpenChange, supplier, onSuccess }: SupplierDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (supplier && isOpen) {
            setFormState({
                name: supplier.name,
                contactPerson: supplier.contactPerson || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || '',
            });
        } else {
            setFormState(initialFormState);
        }
    }, [supplier, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!formState.name) {
            toast.error("Le nom du fournisseur est requis.");
            return;
        }

        setIsLoading(true);
        try {
            if (supplier) {
                await supplierService.updateSupplier(supplier.uuid, formState);
                toast.success(`Fournisseur "${formState.name}" mis à jour.`);
            } else {
                const newSup = await supplierService.findOrCreateSupplier(formState.name);
                await supplierService.updateSupplier(newSup.uuid, formState);
                toast.success(`Fournisseur "${formState.name}" ajouté.`);
            }
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            toast.error("Erreur lors de l'enregistrement.", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // Raccourcis pour le dialogue fournisseur
    useKeyboardShortcuts([
        {
            key: 'Enter',
            ctrl: true,
            action: () => handleSubmit(),
            description: 'Enregistrer le partenaire',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer la fenêtre',
            ignoreInputFocus: true
        }
    ], 'Fournisseur', isOpen);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                <Building className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-xl font-semibold tracking-tight">
                                {supplier ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="font-medium">
                            Gérez les informations de contact de votre fournisseur.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Nom de l'établissement *</Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <Input 
                                    id="name" 
                                    value={formState.name} 
                                    onChange={(e) => setFormState(s => ({...s, name: e.target.value}))} 
                                    className="pl-10 h-11 rounded-xl bg-muted/30 border-none shadow-inner"
                                    placeholder="Ex: Grossiste Alimentaire"
                                    required 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contact" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Contact (Nom)</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                    <Input 
                                        id="contact" 
                                        value={formState.contactPerson} 
                                        onChange={(e) => setFormState(s => ({...s, contactPerson: e.target.value}))} 
                                        className="pl-10 h-11 rounded-xl bg-muted/30 border-none shadow-inner"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Téléphone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                    <Input 
                                        id="phone" 
                                        type="tel"
                                        value={formState.phone} 
                                        onChange={(e) => setFormState(s => ({...s, phone: e.target.value}))} 
                                        className="pl-10 h-11 rounded-xl bg-muted/30 border-none shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">E-mail</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <Input 
                                    id="email" 
                                    type="email"
                                    value={formState.email} 
                                    onChange={(e) => setFormState(s => ({...s, email: e.target.value}))} 
                                    className="pl-10 h-11 rounded-xl bg-muted/30 border-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Adresse</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                                <Input 
                                    id="address" 
                                    value={formState.address} 
                                    onChange={(e) => setFormState(s => ({...s, address: e.target.value}))} 
                                    className="pl-10 h-11 rounded-xl bg-muted/30 border-none shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold flex-1">Annuler</Button>
                        <Button type="submit" disabled={isLoading} className="rounded-xl h-12 font-bold flex-1 shadow-lg shadow-sm">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Valider [Ctrl+Enter]
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
