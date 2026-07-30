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
 * BreadOrderForm Elite - Ultra-dense distribution entry.
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
            toast.error("Sélectionnez un client.");
            return;
        }
        if (mode === 'external' && !customName.trim()) {
            toast.error("Identité requise.");
            return;
        }

        setIsLoading(true);
        try {
            let targetCustomerUuid = mode === 'registered' ? selectedClientUuid : undefined;
            let finalCustomName = mode === 'external' ? customName.trim() : undefined;

            if (mode === 'external' && isRecurring) {
                const names = customName.trim().split(' ');
                const firstName = names[0];
                const lastName = names.slice(1).join(' ') || '(Elite)';
                
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
            toast.error("Échec de l'enregistrement.");
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
            <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-white/5 bg-card shadow-2xl">
                <form onSubmit={handleAdd}>
                    <DialogHeader className="bg-muted/30 p-4 border-b border-white/5">
                        <DialogTitle className="text-sm font-black tracking-widest uppercase">Nouvelle Distribution</DialogTitle>
                    </DialogHeader>

                    <div className="p-4 space-y-4">
                        <div className="flex p-1 bg-black/20 rounded-xl" role="tablist">
                            <button 
                                type="button"
                                onClick={() => { setMode('registered'); setIsRecurring(false); }}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all",
                                    mode === 'registered' ? "bg-card text-primary shadow-sm" : "text-muted-foreground/40"
                                )}
                            >
                                Client Elite
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setMode('external'); setIsRecurring(false); }}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all",
                                    mode === 'external' ? "bg-card text-primary shadow-sm" : "text-muted-foreground/40"
                                )}
                            >
                                Client de Passage
                            </button>
                        </div>

                        <div className="space-y-3">
                            {mode === 'registered' ? (
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase text-muted-foreground/40 ml-1">Compte Client</Label>
                                    <Select value={selectedClientUuid} onValueChange={setSelectedClientUuid}>
                                        <SelectTrigger className="h-10 rounded-xl bg-black/10 border-none shadow-inner font-bold text-xs">
                                            <SelectValue placeholder="Choisir..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-white/5 shadow-2xl">
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
                                    <Label className="text-[8px] font-black uppercase text-muted-foreground/40 ml-1">Nom / Identité</Label>
                                    <Input 
                                        className="h-10 rounded-xl bg-black/10 border-none shadow-inner font-bold text-xs"
                                        value={customName}
                                        onChange={e => setCustomName(e.target.value)}
                                        placeholder="..."
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase text-muted-foreground/40 ml-1">Quantité (PCS)</Label>
                                    <Input 
                                        type="number" 
                                        className="h-10 rounded-xl bg-black/10 border-none shadow-inner font-black text-sm text-primary text-center"
                                        value={quantity}
                                        onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                                        step="0.1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase text-muted-foreground/40 ml-1">Retrait Prévu</Label>
                                    <Input 
                                        type="time" 
                                        className="h-10 rounded-xl bg-black/10 border-none shadow-inner font-black text-sm text-primary text-center"
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
                                    className="h-4 w-4 rounded-md border-primary"
                                />
                                <Label htmlFor="recurring" className="cursor-pointer">
                                    <span className="text-[9px] font-black text-primary uppercase">Générer un abonnement</span>
                                    <p className="text-[7px] text-muted-foreground font-bold uppercase">Création auto tous les jours</p>
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-3 bg-muted/20 border-t border-white/5 flex gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-10 font-bold text-[9px] uppercase px-6">Annuler</Button>
                        <Button 
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl"
                        >
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Valider Flux [Enter]"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
