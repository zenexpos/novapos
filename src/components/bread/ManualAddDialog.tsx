'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { breadService } from '@/services/bread.service';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { Plus, User, UserPlus } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface ManualAddDialogProps {
    currentDate: string;
    onSuccess: () => void;
}

export function ManualAddDialog({ currentDate, onSuccess }: ManualAddDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'registered' | 'external'>('registered');
    const [selectedClientUuid, setSelectedClientUuid] = useState<string>('');
    const [customName, setCustomName] = useState('');
    const [quantity, setQuantity] = useState(10);
    const [manualClients, setManualClients] = useState<Customer[]>([]);

    useEffect(() => {
        if(isOpen && mode === 'registered') {
            customerService.filterCustomers({ status: 'all' })
                .then(setManualClients)
                .catch(() => toast.error("Impossible de charger les clients."));
        }
    }, [isOpen, mode]);

    const handleAdd = async () => {
        if (mode === 'registered' && !selectedClientUuid) {
            toast.error("Veuillez sélectionner un client.");
            return;
        }
        if (mode === 'external' && !customName.trim()) {
            toast.error("Veuillez entrer un nom.");
            return;
        }
        if (quantity <= 0) {
            toast.error("La quantité doit être supérieure à zéro.");
            return;
        }

        try {
            await breadService.addManualBreadOrder({
                customerUuid: mode === 'registered' ? selectedClientUuid : undefined,
                customName: mode === 'external' ? customName.trim() : undefined,
                date: currentDate,
                quantity: quantity
            });
            toast.success("Commande ajoutée.");
            onSuccess();
            setIsOpen(false);
            resetForm();
        } catch(error: any) {
            toast.error("Erreur lors de l'ajout.", { description: error.message });
        }
    };

    useKeyboardShortcuts([
        {
            key: 'Enter',
            action: handleAdd,
            description: 'Ajouter la commande de pain',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => setIsOpen(false),
            description: 'Fermer la fenêtre',
            ignoreInputFocus: true
        }
    ], 'Pain', isOpen);

    const resetForm = () => {
        setSelectedClientUuid('');
        setCustomName('');
        setQuantity(10);
        setMode('registered');
    };

    return (
        <>
            <Button variant="outline" onClick={() => setIsOpen(true)} className="rounded-xl h-10 border-primary/20 hover:bg-primary/5 font-bold">
                <Plus className="mr-2 h-4 w-4 text-primary" /> Ajout Manuel
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold tracking-tight">Ajouter une Commande</DialogTitle>
                        <DialogDescription className="font-medium">Ajouter une commande pour le {currentDate} (Client ou Externe).</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Mode Selector */}
                        <div className="flex p-1 bg-muted rounded-2xl border border-border/50">
                            <button 
                                onClick={() => setMode('registered')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all",
                                    mode === 'registered' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <User className="h-3.5 w-3.5" /> Client Enregistré
                            </button>
                            <button 
                                onClick={() => setMode('external')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all",
                                    mode === 'external' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <UserPlus className="h-3.5 w-3.5" /> Nom Externe
                            </button>
                        </div>

                        {mode === 'registered' ? (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ml-1">Choisir le client</Label>
                                <Select value={selectedClientUuid} onValueChange={setSelectedClientUuid}>
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-inner font-bold">
                                        <SelectValue placeholder="Rechercher un client..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-xl">
                                        {manualClients?.map(client => (
                                            <SelectItem key={client.uuid} value={client.uuid} className="font-bold">
                                                {client.firstName} {client.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ml-1">Nom du demandeur</Label>
                                <Input 
                                    placeholder="Ex: Client de passage..." 
                                    className="h-12 rounded-xl bg-muted/30 border-none shadow-inner font-bold"
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ml-1">Quantité demandée</Label>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    className="h-9 text-lg font-semibold text-center rounded-xl bg-muted/30 border-none shadow-inner focus-visible:ring-primary"
                                    value={quantity} 
                                    onChange={e => setQuantity(parseInt(e.target.value) || 0)} 
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-xs text-muted-foreground opacity-30">PCS</div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold h-12 flex-1">Annuler</Button>
                        <Button onClick={handleAdd} className="rounded-xl font-semibold h-12 flex-1 shadow-lg shadow-sm">
                            Confirmer [Enter]
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
