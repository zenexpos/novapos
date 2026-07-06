'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { breadService } from '@/services/bread.service';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { Plus, User, UserPlus, Loader2, AlertCircle } from 'lucide-react';
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
 * BreadOrderForm Elite - Unified creation engine.
 * Supports manual entry, subscriber mapping and automatic profile creation.
 */
export function BreadOrderForm({ isOpen, onOpenChange, currentDate, onSuccess }: BreadOrderFormProps) {
    const profile = useAppStore(state => state.companyProfile);
    const [mode, setMode] = useState<'registered' | 'external'>('registered');
    const [selectedClientUuid, setSelectedClientUuid] = useState<string>('');
    const [customName, setCustomName] = useState('');
    const [quantity, setQuantity] = useState(10);
    const [unitPrice, setUnitPrice] = useState(profile?.breadPrice || 10);
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
            toast.error("Veuillez sélectionner un client.");
            return;
        }
        if (mode === 'external' && !customName.trim()) {
            toast.error("Veuillez entrer une identité.");
            return;
        }

        setIsLoading(true);
        try {
            let targetCustomerUuid = mode === 'registered' ? selectedClientUuid : undefined;
            let finalCustomName = mode === 'external' ? customName.trim() : undefined;

            // Logic: Create profile if recurring
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
                toast.info(`Dossier Premium créé pour ${firstName}.`);
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

            toast.success("Flux logistique enregistré.");
            onSuccess?.();
            onOpenChange(false);
            resetForm();
        } catch (err: any) {
            console.error("Error adding bread order:", err);
            toast.error("Échec de l'enregistrement.");
        } finally {
            setIsLoading(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'Enter', ctrl: true, action: () => handleAdd(), description: 'Enregistrer flux', ignoreInputFocus: true },
        { key: 'Escape', action: () => onOpenChange(false), description: 'Fermer', ignoreInputFocus: true }
    ], 'SaisiePain', isOpen);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card">
                <form onSubmit={handleAdd}>
                    <DialogHeader className="bg-primary/5 p-6 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                <Plus className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight uppercase">Saisie Manuelle</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mt-1">Nouveau flux de distribution</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="flex p-1 bg-muted rounded-2xl" role="tablist">
                            <button 
                                type="button"
                                onClick={() => { setMode('registered'); setIsRecurring(false); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                                    mode === 'registered' ? "bg-background shadow-sm text-primary" : "text-muted-foreground opacity-50"
                                )}
                            >
                                <User className="h-3.5 w-3.5" /> Client iPOS
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setMode('external'); setIsRecurring(false); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                                    mode === 'external' ? "bg-background shadow-sm text-primary" : "text-muted-foreground opacity-50"
                                )}
                            >
                                <UserPlus className="h-3.5 w-3.5" /> Client de Passage
                            </button>
                        </div>

                        <div className="space-y-4">
                            {mode === 'registered' ? (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Client Elite</Label>
                                    <Select value={selectedClientUuid} onValueChange={setSelectedClientUuid}>
                                        <SelectTrigger className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold">
                                            <SelectValue placeholder="Rechercher..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-2xl">
                                            {manualClients.map(c => (
                                                <SelectItem key={c.uuid} value={c.uuid}>
                                                    {c.firstName} {c.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Identité</Label>
                                    <Input 
                                        className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold"
                                        value={customName}
                                        onChange={e => setCustomName(e.target.value)}
                                        placeholder="Nom complet..."
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Quantité (PCS)</Label>
                                    <Input 
                                        type="number" 
                                        className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-black text-lg text-primary text-center"
                                        value={quantity}
                                        onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                                        step="0.1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Heure de retrait</Label>
                                    <Input 
                                        type="time" 
                                        className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-black text-lg text-primary text-center"
                                        value={pickupTime}
                                        onChange={e => setPickupTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <Checkbox 
                                        id="recurring" 
                                        checked={isRecurring} 
                                        onCheckedChange={(checked) => setIsRecurring(!!checked)}
                                        className="h-5 w-5 rounded-md border-primary"
                                    />
                                    <Label htmlFor="recurring" className="cursor-pointer flex-1">
                                        <div className="text-[10px] font-black text-primary uppercase">Transformer en abonnement</div>
                                        <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-tighter">Générer ce flux automatiquement tous les jours.</p>
                                    </Label>
                                </div>

                                {mode === 'external' && isRecurring && (
                                    <div className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 animate-in zoom-in-95">
                                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-[9px] font-bold text-amber-700 uppercase leading-tight">
                                            Note : Un nouveau profil Premium sera créé automatiquement pour ce client.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-muted/10 border-t border-white/5 flex gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold px-8">Annuler</Button>
                        <Button 
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl gap-3"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Valider Flux
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}