'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { Loader2, Banknote, FileText, Coins, CheckCircle2 } from 'lucide-react';
import { expenseService } from '@/services/expense.service';
import { DatePicker } from '../ui/date-picker';
import { Combobox } from '../ui/combobox';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const defaultCategories: ExpenseCategory[] = ['Loyer', 'Salaires', 'Fournisseurs', 'Services Publics', 'Marketing', 'Maintenance', 'Assurance', 'Transport', 'Autre'];

interface ExpenseDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    expense: Expense | null;
    onSuccess: () => void;
    existingCategories: string[];
}

const initialFormState: Omit<Expense, 'uuid' | 'createdAt' | 'updatedAt'> = {
    description: '',
    category: 'Autre',
    amount: 0,
    expenseDate: new Date(),
};

export default function ExpenseDialog({ isOpen, onOpenChange, expense, onSuccess, existingCategories }: ExpenseDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

     useEffect(() => {
        if (expense && isOpen) {
            setFormState({
                description: expense.description,
                category: expense.category,
                amount: expense.amount,
                expenseDate: new Date(expense.expenseDate),
            });
        } else if (!expense && isOpen) {
            setFormState({ ...initialFormState, expenseDate: new Date() });
        }
    }, [expense, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };
    
    const handleCategoryChange = (value: string) => {
        setFormState(prev => ({ ...prev, category: value as ExpenseCategory }));
    };

    const handleDateChange = (date?: Date) => {
        if (date) {
            setFormState(prev => ({ ...prev, expenseDate: date }));
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError(null);
        setIsLoading(true);

        const amountNum = Number(formState.amount);

        if (!formState.description.trim() || isNaN(amountNum) || amountNum <= 0) {
            setError("Veuillez remplir la description et un montant valide.");
            setIsLoading(false);
            return;
        }

        const dataToSave = {
            ...formState,
            amount: amountNum,
            expenseDate: new Date(formState.expenseDate)
        };

        try {
            if (expense && expense.uuid) {
                await expenseService.updateExpense(expense.uuid, dataToSave);
                toast.success(`Dépense mise à jour.`);
            } else {
                await expenseService.addExpense(dataToSave);
                toast.success(`Dépense enregistrée avec succès.`);
            }
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
            toast.error("Opération échouée.");
        } finally {
            setIsLoading(false);
        }
    };

    // Raccourcis pour le dialogue de dépense
    useKeyboardShortcuts([
        {
            key: 'Enter',
            ctrl: true,
            action: () => handleSubmit(),
            description: 'Valider la charge',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer la fenêtre',
            ignoreInputFocus: true
        }
    ], 'Charge', isOpen);
    
    const categoryOptions = Array.from(new Set([...defaultCategories, ...existingCategories]))
        .sort()
        .map(c => ({ value: c, label: c }));

    const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shadow-inner">
                <Icon className="h-3 w-3" />
            </div>
            <h4 className="text-[10px] font-semibold uppercase text-muted-foreground opacity-60">{title}</h4>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl rounded-lg border-none shadow-sm p-0 overflow-hidden bg-card">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="bg-primary/5 p-4 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                                <Banknote className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold tracking-tight">
                                    {expense ? 'Édition du Flux' : 'Nouvelle Charge Elite'}
                                </DialogTitle>
                                <DialogDescription className="font-medium">Gestion souveraine des sorties de trésorerie.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-xs font-bold border border-destructive/20 text-center">{error}</div>}
                        
                        <div>
                            <SectionTitle title="Description du Flux" icon={FileText} />
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ml-1">Intitulé de la dépense *</Label>
                                    <Input 
                                        id="description" 
                                        value={formState.description} 
                                        onChange={handleInputChange} 
                                        className="h-9 rounded-2xl bg-muted/20 border-none shadow-inner text-lg font-semibold tracking-tight focus-visible:ring-primary/20" 
                                        placeholder="Ex: Facture électricité Janvier"
                                        required 
                                        autoFocus 
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ml-1">Poste de Dépense</Label>
                                        <Combobox 
                                            options={categoryOptions}
                                            value={formState.category}
                                            onSelect={handleCategoryChange}
                                            placeholder="Choisir..."
                                            searchPlaceholder="Chercher..."
                                            notFoundMessage="Nouveau poste..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ml-1">Date d'Opération</Label>
                                        <DatePicker date={formState.expenseDate} setDate={handleDateChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionTitle title="Audit Financier" icon={Coins} />
                            <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/10 space-y-4 group hover:bg-destructive/10 transition-all duration-500 shadow-inner">
                                <div className="flex items-center gap-3 text-destructive">
                                    <div className="p-2.5 rounded-xl bg-destructive/10 shadow-sm">
                                        <Coins className="h-5 w-5" />
                                    </div>
                                    <Label htmlFor="amount" className="text-[10px] font-semibold uppercase ">Montant décaissé (DA)</Label>
                                </div>
                                <div className="relative">
                                    <Input 
                                        id="amount" 
                                        type="number" 
                                        step="0.1" 
                                        value={formState.amount || ''} 
                                        onChange={handleInputChange} 
                                        className="h-20 rounded-2xl bg-background border-none shadow-sm font-semibold text-xl text-destructive text-center focus-visible:ring-destructive/20 px-8" 
                                        placeholder="0.0"
                                        required 
                                    />
                                    <span className="absolute right-8 top-1/2 -translate-y-1/2 font-semibold text-xs text-destructive opacity-40 uppercase tracking-wide">DA</span>
                                </div>
                                <p className="text-[9px] text-muted-foreground/50 text-center italic">
                                    Déduit immédiatement de la trésorerie globale.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-card border-t border-white/5 flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-9 rounded-2xl font-semibold text-xs uppercase tracking-wide px-8" disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading} className="flex-1 h-9 rounded-2xl font-semibold text-xs uppercase tracking-wide shadow-xl shadow-sm transition-all active:scale-95 gap-3">
                             {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                            Valider [Ctrl+Enter]
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
