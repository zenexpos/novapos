'use client';

import { useState, useEffect } from 'react';
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

interface BreadOrderFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    currentDate: string;
    onSuccess?: () => void;
}

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

    useEffect(() => {
        if(isOpen && mode === 'registered') {
            customerService.getCustomers().then(setManualClients);
        }
        if (profile?.breadPrice) setUnitPrice(profile.breadPrice);
    }, [isOpen, mode, profile?.breadPrice]);

    const handleAdd = async () => {
        if (mode === 'registered' && !selectedClientUuid) {
            toast.error("Sélectionnez un client.");
            return;
        }
        if (mode === 'external' && !customName.trim()) {
            toast.error("Entrez un nom.");
            return;
        }

        setIsLoading(true);
        try {
            let targetCustomerUuid = mode === 'registered' ? selectedClientUuid : undefined;
            let finalCustomName = mode === 'external' ? customName.trim() : undefined;

            // Automation Logic: Convert external client to permanent subscriber
            if (mode === 'external' && isRecurring) {
                const names = customName.trim().split(' ');
                const firstName = names[0];
                const lastName = names.slice(1).join(' ') || '(Abonné)';
                
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
                toast.info(`Nouveau profil créé pour ${firstName}.`);
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

            toast.success("Commande enregistrée dans le flux.");
            onSuccess?.();
            onOpenChange(false);
            resetForm();
        } catch(e: any) {
            toast.error("Échec de l'enregistrement.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedClientUuid('');
        setCustomName('');
        setQuantity(10);
        setIsRecurring(false);
        setPickupTime('08:00');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="bg-primary/5 p-6 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                            <Plus className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight uppercase">Nouvelle Commande</DialogTitle>
                            <DialogDescription className="text-xs font-bold text-primary/40 uppercase tracking-widest mt-1">Saisie manuelle d'un flux de pain</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="flex p-1 bg-muted rounded-2xl">
                        <button 
                            onClick={() => { setMode('registered'); setIsRecurring(false); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                                mode === 'registered' ? "bg-background shadow-sm text-primary" : "text-muted-foreground opacity-50"
                            )}
                        >
                            <User className="h-3.5 w-3.5" /> Client iPOS
                        </button>
                        <button 
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
                                        {manualClients.map(c => <SelectItem key={c.uuid} value={c.uuid}>{c.firstName} {c.lastName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Identité du client</Label>
                                <Input 
                                    className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold"
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                    placeholder="Ex: Client X..."
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
                                    onChange={e => setQuantity(Number(e.target.value))}
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
                                    <div className="text-[10px] font-black text-primary uppercase">Activer abonnement quotidien</div>
                                    <p className="text-[8px] text-muted-foreground mt-0.5 uppercase tracking-tighter">Générer ce débit automatiquement chaque matin.</p>
                                </Label>
                            </div>

                            {mode === 'external' && isRecurring && (
                                <div className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 animate-in zoom-in-95">
                                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-[9px] font-bold text-amber-700 uppercase leading-tight">
                                        Note : Un profil client permanent sera créé pour gérer cet abonnement récurrent.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-muted/10 border-t border-white/5 flex gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold px-8">Annuler</Button>
                    <Button 
                        onClick={handleAdd} 
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl gap-3"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Valider Flux
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
