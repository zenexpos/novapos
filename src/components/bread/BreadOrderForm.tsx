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
import { Loader2 } from 'lucide-react';
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
 * BreadOrderForm Zen - Interface de saisie ultra-pure.
 * Optimisée pour la productivité Elite sans distraction.
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
        if (isOpen) {
            if (mode === 'registered') fetchClients();
            if (profile?.breadPrice) setUnitPrice(profile.breadPrice);
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
            toast.error("Client requis.");
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
                const newCustomer = await customerService.addCustomer({
                    firstName: names[0],
                    lastName: names.slice(1).join(' ') || '(Pain)',
                    phone: '',
                    address: '',
                    initialBalance: 0,
                    isBreadClient: true
                });
                targetCustomerUuid = newCustomer.uuid;
                finalCustomName = undefined;
                await customerService.updateCustomer(newCustomer.uuid, {
                    breadProfile: { recurrenceType: 'quotidien', defaultQuantity: quantity, startDate: currentDate, weeklySchedule: {} }
                });
            } else if (mode === 'registered' && isRecurring && selectedClientUuid) {
                const client = manualClients.find(c => c.uuid === selectedClientUuid);
                await customerService.updateCustomer(selectedClientUuid, {
                    isBreadClient: true,
                    breadProfile: { recurrenceType: 'quotidien', defaultQuantity: quantity, startDate: client?.breadProfile?.startDate || currentDate, weeklySchedule: client?.breadProfile?.weeklySchedule || {} }
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
            toast.error("Erreur d'enregistrement.");
        } finally {
            setIsLoading(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'Enter', ctrl: true, action: () => handleAdd(), description: 'Enregistrer', ignoreInputFocus: true },
        { key: 'Escape', action: () => onOpenChange(false), description: 'Fermer', ignoreInputFocus: true }
    ], 'SaisiePainSimple', isOpen);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[340px] p-0 overflow-hidden border-none bg-card shadow-2xl rounded-2xl">
                <form onSubmit={handleAdd}>
                    <DialogHeader className="p-4 border-b border-border">
                        <DialogTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 text-center">Nouveau Flux Pain</DialogTitle>
                    </DialogHeader>

                    <div className="p-4 space-y-5">
                        <div className="flex p-0.5 bg-muted/30 rounded-lg">
                            <button 
                                type="button"
                                onClick={() => setMode('registered')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all",
                                    mode === 'registered' ? "bg-card text-primary shadow-sm" : "text-muted-foreground/30 hover:text-muted-foreground"
                                )}
                            >
                                Client Elite
                            </button>
                            <button 
                                type="button"
                                onClick={() => setMode('external')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all",
                                    mode === 'external' ? "bg-card text-primary shadow-sm" : "text-muted-foreground/30 hover:text-muted-foreground"
                                )}
                            >
                                Passage
                            </button>
                        </div>

                        <div className="space-y-4">
                            {mode === 'registered' ? (
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase opacity-30 ml-1">Client Destinataire</Label>
                                    <Select value={selectedClientUuid} onValueChange={setSelectedClientUuid}>
                                        <SelectTrigger className="h-9 bg-muted/20 border-none font-bold text-xs">
                                            <SelectValue placeholder="Choisir client..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {manualClients.map(c => (
                                                <SelectItem key={c.uuid} value={c.uuid} className="text-xs font-bold uppercase">{c.firstName} {c.lastName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase opacity-30 ml-1">Identité / Nom</Label>
                                    <Input 
                                        className="h-9 bg-muted/20 border-none font-bold text-xs uppercase"
                                        value={customName}
                                        onChange={e => setCustomName(e.target.value)}
                                        placeholder="..."
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase opacity-30 ml-1">Quantité (PCS)</Label>
                                    <Input 
                                        type="number" 
                                        className="h-9 bg-muted/20 border-none font-black text-center text-primary text-base"
                                        value={quantity}
                                        onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                                        step="0.5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase opacity-30 ml-1">Heure Retrait</Label>
                                    <Input 
                                        type="time" 
                                        className="h-9 bg-muted/20 border-none font-black text-center text-primary"
                                        value={pickupTime}
                                        onChange={e => setPickupTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                                <Checkbox 
                                    id="recurring" 
                                    checked={isRecurring} 
                                    onCheckedChange={(checked) => setIsRecurring(!!checked)}
                                    className="h-3.5 w-3.5 border-primary/30"
                                />
                                <Label htmlFor="recurring" className="cursor-pointer">
                                    <p className="text-[9px] font-black uppercase text-primary leading-none">Activer abonnement quotidien</p>
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-3 bg-muted/20 border-t border-border flex gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-9 font-bold text-[9px] uppercase px-4 flex-1">Annuler</Button>
                        <Button 
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] h-9 font-black text-[9px] uppercase tracking-widest shadow-lg"
                        >
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Valider Flux [Enter]'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
