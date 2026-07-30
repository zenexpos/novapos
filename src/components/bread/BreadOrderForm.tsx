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
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';

interface BreadOrderFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    currentDate: string;
    onSuccess?: () => void;
}

/**
 * BreadOrderForm Elite.
 * Interface de saisie ultra-dense et épurée (Zéro Extra).
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

    const { value: clients } = useLiveQuery<Customer[]>(
        () => db.customers.filter(c => !c.deletedAt).toArray(),
        []
    );

    useEffect(() => {
        if (isOpen) {
            if (profile?.breadPrice) setUnitPrice(profile.breadPrice);
            if (!selectedClientUuid) setMode('registered');
        }
    }, [isOpen, profile?.breadPrice, selectedClientUuid]);

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
            toast.error("Sélectionnez un client");
            return;
        }
        if (mode === 'external' && !customName.trim()) {
            toast.error("Identité requise");
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
                    lastName: names.slice(1).join(' ') || '(PAIN)',
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
            }

            await breadService.addManualBreadOrder({
                customerUuid: targetCustomerUuid,
                customName: finalCustomName,
                date: currentDate,
                quantity,
                unitPrice,
                pickupTime
            });

            toast.success("Flux validé");
            onSuccess?.();
            onOpenChange(false);
            resetForm();
        } catch (err: any) {
            toast.error("Erreur technique");
        } finally {
            setIsLoading(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'Enter', ctrl: true, action: () => handleAdd(), description: 'Valider', ignoreInputFocus: true },
        { key: 'Escape', action: () => onOpenChange(false), description: 'Fermer', ignoreInputFocus: true }
    ], 'SaisiePainElite', isOpen);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[340px] p-0 overflow-hidden border-none bg-card shadow-2xl rounded-2xl">
                <form onSubmit={handleAdd}>
                    <DialogHeader className="p-4 border-b border-border bg-muted/20">
                        <DialogTitle className="text-[10px] font-black uppercase tracking-widest text-center">SAISIE DISTRIBUTION</DialogTitle>
                    </DialogHeader>

                    <div className="p-4 space-y-4">
                        <div className="flex p-0.5 bg-muted/40 rounded-lg">
                            <button 
                                type="button"
                                onClick={() => setMode('registered')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all",
                                    mode === 'registered' ? "bg-card text-primary shadow-sm" : "text-muted-foreground/30"
                                )}
                            >
                                COMPTE ELITE
                            </button>
                            <button 
                                type="button"
                                onClick={() => setMode('external')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all",
                                    mode === 'external' ? "bg-card text-primary shadow-sm" : "text-muted-foreground/30"
                                )}
                            >
                                PASSAGE
                            </button>
                        </div>

                        <div className="space-y-3">
                            {mode === 'registered' ? (
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase opacity-40 ml-1">ASSIGNATION CLIENT</Label>
                                    <Select value={selectedClientUuid} onValueChange={setSelectedClientUuid}>
                                        <SelectTrigger className="h-9 bg-muted/20 border-none font-bold text-xs uppercase">
                                            <SelectValue placeholder="..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients?.sort((a,b) => a.firstName.localeCompare(b.firstName)).map(c => (
                                                <SelectItem key={c.uuid} value={c.uuid} className="text-xs font-bold uppercase">{c.firstName} {c.lastName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase opacity-40 ml-1">IDENTITÉ / NOM</Label>
                                    <Input 
                                        className="h-9 bg-muted/20 border-none font-black text-xs uppercase"
                                        value={customName}
                                        onChange={e => setCustomName(e.target.value)}
                                        placeholder="NOM DU CLIENT"
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase opacity-40 ml-1">QUANTITÉ (PCS)</Label>
                                    <Input 
                                        type="number" 
                                        className="h-9 bg-muted/20 border-none font-black text-center text-primary text-base"
                                        value={quantity}
                                        onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                                        step="0.5"
                                        min="0"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase opacity-40 ml-1">HEURE RETRAIT</Label>
                                    <Input 
                                        type="time" 
                                        className="h-9 bg-muted/20 border-none font-black text-center text-primary text-xs"
                                        value={pickupTime}
                                        onChange={e => setPickupTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-xl border border-primary/10">
                                <Checkbox 
                                    id="recurring" 
                                    checked={isRecurring} 
                                    onCheckedChange={(checked) => setIsRecurring(!!checked)}
                                    className="h-3 w-3 border-primary/30"
                                />
                                <Label htmlFor="recurring" className="cursor-pointer text-[8px] font-black uppercase text-primary tracking-widest">ACTIVER RÉCURRENCE</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-2 bg-muted/20 border-t border-border flex gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-9 font-black text-[9px] uppercase px-4 flex-1">FERMER</Button>
                        <Button type="submit" disabled={isLoading} className="flex-[2] h-9 font-black text-[9px] uppercase tracking-widest shadow-lg">
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'VALIDER FLUX'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
