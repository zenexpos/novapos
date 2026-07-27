'use client';

import React, { useState, useMemo, useEffect, forwardRef, useDeferredValue, useImperativeHandle, useRef } from 'react';
import { customerService } from '@/services/customer.service';
import { useCartActions, useActiveCart } from '@/stores/cartStore';
import { formatCurrency, cn } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import { toast } from 'sonner';
import { 
    UserPlus, 
    Search, 
    User, 
    UserX, 
    Phone, 
    ChevronRight,
    Users,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { Badge } from '@/components/ui/badge';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { EMPTY_ARRAY } from '@/lib/constants';

export const CustomerCombobox = forwardRef<{ focusInput: () => void }, React.ComponentPropsWithoutRef<'div'>>((_, ref) => {
    const { toggleCustomer, clearCustomers } = useCartActions();
    const activeCart = useActiveCart();
    
    // FIXED: Use useMemo with primitive values to stabilize dependencies for useLiveQuery
    const selectedUuids = useMemo(() => activeCart?.customerUuids || (EMPTY_ARRAY as string[]), [activeCart?.customerUuids]);
    
    const [isOpen, setIsOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearch = useDeferredValue(searchQuery);
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const internalInputRef = useRef<HTMLInputElement>(null);

    // Resolve details of all selected customers with stable deps
    const { value: selectedCustomersDetails } = useLiveQuery<Customer[]>(
        () => selectedUuids.length > 0
            ? db.customers.where('uuid').anyOf(selectedUuids).toArray()
            : Promise.resolve(EMPTY_ARRAY as Customer[]),
        [selectedUuids]
    );

    const displayName = useMemo(() => {
        if (selectedUuids.length === 0) return "Client de passage";
        if (selectedUuids.length === 1 && selectedCustomersDetails?.[0]) {
            return `${selectedCustomersDetails[0].firstName} ${selectedCustomersDetails[0].lastName}`;
        }
        return `${selectedUuids.length} Clients sélectionnés`;
    }, [selectedUuids, selectedCustomersDetails]);

    useImperativeHandle(ref, () => ({
        focusInput: () => {
            setIsOpen(true);
            setTimeout(() => internalInputRef.current?.focus(), 100);
        }
    }));

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const data = await customerService.getCustomers();
            setCustomers(data);
        } catch (e) {
            toast.error("Échec du chargement de la liste clients");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            setSearchQuery('');
        }
    }, [isOpen]);

    const filteredCustomers = useMemo(() => {
        if (!deferredSearch.trim()) return customers.slice(0, 20);
        const q = deferredSearch.toLowerCase().trim();
        return customers.filter(c => 
            (c.firstName || '').toLowerCase().includes(q) || 
            (c.lastName || '').toLowerCase().includes(q) || 
            (c.phone || '').includes(q)
        );
    }, [customers, deferredSearch]);

    const handleSelect = (uuid: string) => {
        toggleCustomer(uuid);
    };

    const handleNewCustomerSuccess = (customer?: Customer) => {
        if (customer) {
            toggleCustomer(customer.uuid);
            setIsOpen(false);
            toast.success(`Client ${customer.firstName} enregistré et ajouté`);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className={cn(
                    "h-9 px-4 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all gap-2 group shadow-sm max-w-[250px]",
                    selectedUuids.length > 1 && "border-primary/50 bg-primary/10"
                )}
            >
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-bold uppercase tracking-tight truncate">
                    {displayName} [F2]
                </span>
                {selectedUuids.length > 1 && (
                    <Badge variant="secondary" className="h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                        {selectedUuids.length}
                    </Badge>
                )}
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                    <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black tracking-tight">Sélection des Clients</DialogTitle>
                                    <p className="text-[10px] font-bold uppercase text-primary/50">Assigner un ou plusieurs clients à cette facture</p>
                                </div>
                            </div>
                            {selectedUuids.length > 0 && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={clearCustomers}
                                    className="text-[10px] font-black uppercase text-destructive hover:bg-destructive/10"
                                >
                                    <XCircle className="h-3 w-3 mr-1.5" /> Réinitialiser
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                ref={internalInputRef}
                                placeholder="Rechercher par nom یا رقم هاتف..."
                                className="pl-14 h-12 text-lg font-bold rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <ScrollArea className="h-[400px] pr-4 -mr-4">
                            <div className="space-y-2">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                        <Users className="h-12 w-12 animate-pulse" />
                                        <p className="text-xs font-bold uppercase mt-4">Chargement...</p>
                                    </div>
                                ) : filteredCustomers.length > 0 ? (
                                    filteredCustomers.map(c => {
                                        const isSelected = selectedUuids.includes(c.uuid);
                                        return (
                                            <div 
                                                key={c.uuid}
                                                onClick={() => handleSelect(c.uuid)}
                                                className={cn(
                                                    "group flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer shadow-inner border-2",
                                                    isSelected 
                                                        ? "bg-primary/10 border-primary/40" 
                                                        : "bg-muted/20 border-transparent hover:border-primary/20 hover:bg-primary/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "p-2.5 rounded-xl border shadow-sm group-hover:scale-110 transition-transform",
                                                        isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background border-white/5"
                                                    )}>
                                                        {isSelected ? <CheckCircle2 className="h-5 w-5" /> : <User className="h-5 w-5 text-primary/60" />}
                                                    </div>
                                                    <div className="flex flex-col -space-y-0.5">
                                                        <p className={cn("font-bold text-sm tracking-tight", isSelected && "text-primary")}>{c.firstName} {c.lastName}</p>
                                                        <p className="text-[10px] font-mono text-muted-foreground/50">{c.phone || 'Sans téléphone'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {c.outstandingBalance > 0 && (
                                                        <div className="text-right px-4 border-r border-white/5">
                                                            <p className="text-[8px] font-bold uppercase text-destructive/50">Solde dû</p>
                                                            <p className="text-sm font-black text-destructive tracking-tighter">{formatCurrency(c.outstandingBalance)}</p>
                                                        </div>
                                                    )}
                                                    <Badge variant={isSelected ? "default" : "outline"} className="text-[9px] font-black uppercase">
                                                        {isSelected ? 'Sélectionné' : 'Choisir'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-20 opacity-20">
                                        <UserX className="h-12 w-12 mx-auto mb-4" />
                                        <p className="text-sm font-bold uppercase">Aucun résultat</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="p-4 bg-muted/10 border-t border-white/5 flex gap-3">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsOpen(false)}
                            className="flex-1 h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                        >
                            Fermer
                        </Button>
                        <Button 
                            onClick={() => setIsAddDialogOpen(true)}
                            className="flex-1 h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl"
                        >
                            <UserPlus className="h-4 w-4" /> Nouveau Client
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <CustomerDialog 
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                customer={null}
                onSuccess={handleNewCustomerSuccess}
            />
        </>
    );
});
CustomerCombobox.displayName = "CustomerCombobox";
