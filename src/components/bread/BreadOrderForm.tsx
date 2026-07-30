'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { breadService } from '@/services/bread.service';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface BreadOrderFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    currentDate: string;
    onSuccess?: () => void;
}

/**
 * BreadOrderForm Zen - Ultra-dense distribution entry.
 */
export function BreadOrderForm({ isOpen, onOpenChange, currentDate, onSuccess }: BreadOrderFormProps) {
    const profile = useAppStore(state => state.companyProfile);
    const [mode, setMode] = useState<'registered' | 'external'>('registered');
    const [selectedClientUuid, setSelectedClientUuid] = useState<string>('');
    const [customName, setCustomName] = useState('');
    const [quantity, setQuantity] = useState(10);
    const [unitPrice, setUnitPrice] = useState(10);
    const [pickupTime, setPickupTime] = useState('08:00');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [manualClients, setManualClients] = useState<Customer[]>([]);

    const fetchClients = useCallback(async () => {
        try {
            const data = await customerService.getCustomers();
            setManualClients(data);
        } catch (e) {
            console.error("Error fetching clients:", e);
        }
    }, []);

    useEffect(() => {
        if (isOpen && mode === 'registered') {
            fetchClients();
        }
        if (profile?.breadPrice) {
            setUnitPrice(profile.breadPrice);
        }
    }, [isOpen, mode, profile?.breadPrice, fetchClients]);

    const resetForm = useCallback(() => {
        setSelectedClientUuid('');
        setCustomName('');
        setQuantity(10);
        setIsRecurring(false);
        setPickupTime('08:00');
    }, []);

    const handleAdd = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (mode === 'registered' && !selectedClientUuid) {
            toast.error("Choisissez un client.");
            return;
        }
        if (mode === 'external' && !customName.trim()) {
            toast.error("Nom requis.");
            return;
        }

        setIsLoading(true);
        try {
            let targetCustomerUuid = mode === 'registered' ? selectedClientUuid : undefined;
            let finalCustomName = mode === 'external' ? customName.trim() : undefined;

            if (mode === 'external' && isRecurring) {
                const names = customName.trim().split(' ');
                const firstName = names[0];
                const lastName = names.slice(1).join(' ') || '(Pain)';
                
                const newCustomer = await customerService.addCustomer({
                    firstName,
                    lastName,
                    phone: '',
                    address: '',
                    initialBalance: 0,
                    isBreadClient: true
                });
                
                targetCustomerUuid = newCustomer.uuid;
                finalCustomName = undefined;

                await customerService.updateCustomer(newCustomer.uuid, {
                    breadProfile: {
                        recurrenceType: 'quotidien',
                        defaultQuantity: quantity,
                        startDate: currentDate,
                        weeklySchedule: {}
                    }
                });
            } else if (mode === 'registered' && isRecurring && selectedClientUuid) {
                const client = manualClients.find(c => c.uuid === selectedClientUuid);
                await customerService.updateCustomer(selectedClientUuid, {
                    isBreadClient: true,
                    breadProfile: {
                        recurrenceType: 'quotidien',
                        defaultQuantity: quantity,
                        startDate: client?.breadProfile?.startDate || currentDate,
                        weeklySchedule: client?.breadProfile?.weeklySchedule || {}
                    }
                });
            }

            await breadService.addManualBreadOrder({
                customerUuid: targetCustomerUuid,
                customName: finalCustomName,
                date: currentDate,
                quantity,
                unitPrice,
                pickupTime
            });

            toast.success("Flux enregistré.");
            onSuccess?.();
            onOpenChange(false);
            resetForm();
        } catch (err: any) {
            toast.error("Erreur de sauvegarde.");
        } finally {
            setIsLoading(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'Enter', ctrl: true, action: () => handleAdd(), description: 'Valider flux', ignoreInputFocus: true },
        { key: 'Escape', action: () => onOpenChange(false), description: 'Fermer', ignoreInputFocus: true }
    ], 'SaisiePain', isOpen);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none bg-card shadow-2xl rounded-2xl">
                <form onSubmit={handleAdd}>
                    <DialogHeader className="p-4 border-b border-border bg-muted/50">
                        <DialogTitle className="text-xs font-black uppercase tracking-widest text-foreground/60">Nouvelle Saisie</DialogTitle>
                    </DialogHeader>

                    <div className="p-4 space-y-5">
                        <div className="flex p-0.5 bg-black/10 rounded-lg">
                            <button 
                                type="button"
                                onClick={() => setMode('registered')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all",
                                    mode === 'registered' ? "bg-card text-primary shadow-sm" : "text-muted-foreground/40 hover:text-muted-foreground"
                                )}
                            >
                                Client Compte
                            </button>
                            <button 
                                type="button"
                                onClick={() => setMode('external')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all",
                                    mode === 'external' ? "bg-card text-primary shadow-sm" : "text-muted-foreground/40 hover:text-muted-foreground"
                                )}
                            >
                                Passage
                            </button>
                        </div>

                        <div className="space-y-4">
                            {mode === 'registered' ? (
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Sélection Client</Label>
                                    <Select value={selectedClientUuid} onValueChange={setSelectedClientUuid}>
                                        <SelectTrigger className="h-10 bg-black/5 border-none font-bold text-xs">
                                            <SelectValue placeholder="Choisir..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {manualClients.map(c => (
                                                <SelectItem key={c.uuid} value={c.uuid} className="text-xs font-bold">
                                                    {c.firstName} {c.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Nom / Identité</Label>
                                    <Input 
                                        className="h-10 bg-black/5 border-none font-bold text-xs"
                                        value={customName}
                                        onChange={e => setCustomName(e.target.value)}
                                        placeholder="..."
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Quantité (PCS)</Label>
                                    <Input 
                                        type="number" 
                                        className="h-10 bg-black/5 border-none font-black text-center text-primary"
                                        value={quantity}
                                        onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                                        step="0.5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Heure Retrait</Label>
                                    <Input 
                                        type="time" 
                                        className="h-10 bg-black/5 border-none font-black text-center text-primary"
                                        value={pickupTime}
                                        onChange={e => setPickupTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 transition-all hover:bg-primary/10">
                                <Checkbox 
                                    id="recurring" 
                                    checked={isRecurring} 
                                    onCheckedChange={(checked) => setIsRecurring(!!checked)}
                                    className="h-4 w-4 border-primary/40 data-[state=checked]:bg-primary"
                                />
                                <Label htmlFor="recurring" className="cursor-pointer space-y-0.5">
                                    <p className="text-[9px] font-black uppercase text-primary">Créer Abonnement</p>
                                    <p className="text-[7px] font-bold uppercase text-muted-foreground/40">Génération auto journalière</p>
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-3 bg-muted/30 border-t border-border flex gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-10 font-bold text-[9px] uppercase px-4">Annuler</Button>
                        <Button 
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-10 font-black text-[9px] uppercase tracking-widest shadow-lg"
                        >
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1.5" /> Enregistrer [Enter]</>}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
