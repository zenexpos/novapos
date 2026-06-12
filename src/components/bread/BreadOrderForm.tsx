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
import { Plus, User, UserPlus, Coins, Package, Clock, Loader2, RefreshCw } from 'lucide-react';
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
    const [unitPrice, setUnitPrice] = useState(profile?.prix_pain || 10);
    const [pickupTime, setPickupTime] = useState('08:00');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [manualClients, setManualClients] = useState<Customer[]>([]);

    useEffect(() => {
        if(isOpen && mode === 'registered') {
            customerService.getCustomers().then(setManualClients);
        }
        if (profile?.prix_pain) setUnitPrice(profile.prix_pain);
    }, [isOpen, mode, profile?.prix_pain]);

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
            // 1. Ajouter la commande pour aujourd'hui
            await breadService.addManualBreadOrder({
                customerUuid: mode === 'registered' ? selectedClientUuid : undefined,
                customName: mode === 'external' ? customName.trim() : undefined,
                date: currentDate,
                quantity,
                unitPrice,
                pickupTime
            });

            // 2. Si récurrent et client enregistré, mettre à jour le profil client via le modèle imbriqué
            if (mode === 'registered' && isRecurring && selectedClientUuid) {
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
                toast.success("Abonnement quotidien activé pour ce client.");
            }

            toast.success("Commande enregistrée.");
            onSuccess?.();
            onOpenChange(false);
            resetForm();
        } catch(e: any) {
            toast.error(e.message || "Une erreur est survenue.");
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
            <DialogContent className="sm:max-w-lg rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="bg-primary/5 p-6 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                            <Plus className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight uppercase">Nouvelle Commande de Pain</DialogTitle>
                            <DialogDescription className="text-xs font-bold text-primary/40 uppercase tracking-widest mt-1">Saisie d'un flux de distribution direct</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="flex p-1 bg-muted rounded-2xl border border-white/5 shadow-inner">
                        <button 
                            onClick={() => setMode('registered')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                                mode === 'registered' ? "bg-background shadow-sm text-primary" : "text-muted-foreground opacity-50"
                            )}
                        >
                            <User className="h-3.5 w-3.5" /> Client Enregistré
                        </button>
                        <button 
                            onClick={() => setMode('external')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                                mode === 'external' ? "bg-background shadow-sm text-primary" : "text-muted-foreground opacity-50"
                            )}
                        >
                            <UserPlus className="h-3.5 w-3.5" /> Client Passager
                        </button>
                    </div>

                    <div className="grid gap-6">
                        {mode === 'registered' ? (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Identifier le client</Label>
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
                                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Nom du client</Label>
                                <Input 
                                    className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold"
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Quantité (Pains)</Label>
                                <div className="relative group">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/20 group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        type="number" 
                                        className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-black text-lg text-primary text-center"
                                        value={quantity}
                                        onChange={e => setQuantity(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Heure de retrait</Label>
                                <div className="relative group">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/20 group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        type="time" 
                                        className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-black text-lg text-primary text-center"
                                        value={pickupTime}
                                        onChange={e => setPickupTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {mode === 'registered' && (
                            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 transition-all hover:bg-primary/10">
                                <Checkbox 
                                    id="recurring" 
                                    checked={isRecurring} 
                                    onCheckedChange={(checked) => setIsRecurring(!!checked)}
                                    className="h-5 w-5 rounded-md border-primary"
                                />
                                <Label htmlFor="recurring" className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
                                        <RefreshCw className="h-3 w-3" /> Rendre ce débit récurrent quotidiennement
                                    </div>
                                    <p className="text-[9px] text-muted-foreground mt-0.5">Le système générera ce débit automatiquement chaque matin.</p>
                                </Label>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-end shadow-inner">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Total à facturer</span>
                        <span className="text-2xl font-black tracking-tighter tabular-nums text-primary">{(quantity * unitPrice).toFixed(2)} DA</span>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-muted/10 border-t border-white/5 gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold px-8">Annuler</Button>
                    <Button 
                        onClick={handleAdd} 
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 gap-3"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Valider la Commande
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
