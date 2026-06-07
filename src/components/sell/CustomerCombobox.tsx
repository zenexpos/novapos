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
    Users
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
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';

export const CustomerCombobox = forwardRef<{ focusInput: () => void }, React.ComponentPropsWithoutRef<'div'>>((_, ref) => {
    const { setCustomer } = useCartActions();
    const activeCart = useActiveCart();
    
    const [isOpen, setIsOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearch = useDeferredValue(searchQuery);
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const internalInputRef = useRef<HTMLInputElement>(null);

    // Resolve the selected customer details in real-time
    const { value: selectedCustomer } = useLiveQuery<Customer | null>(
        () => activeCart?.customerUuid
            ? db.customers.where('uuid').equals(activeCart.customerUuid).first().then(c => c ?? null)
            : Promise.resolve(null),
        [activeCart?.customerUuid]
    );

    const displayName = selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : "Client de passage";

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

    const handleSelect = (uuid: string | null) => {
        setCustomer(uuid);
        setIsOpen(false);
        if (uuid) {
            const c = customers.find(cust => cust.uuid === uuid);
            if (c) toast.success(`Client : ${c.firstName} ${c.lastName}`);
        } else {
            toast.info("Sélection : Client de passage");
        }
    };

    const handleNewCustomerSuccess = (customer?: Customer) => {
        if (customer) {
            setCustomer(customer.uuid);
            setIsOpen(false);
            toast.success(`Client ${customer.firstName} enregistré avec succès`);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="h-9 px-4 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all gap-2 group shadow-sm max-w-[200px]"
            >
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-bold uppercase tracking-tight truncate">
                    {displayName} [F2]
                </span>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                    <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight">Liste des Clients</DialogTitle>
                                <p className="text-[10px] font-bold uppercase text-primary/50">Identifier le client actuel</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                ref={internalInputRef}
                                placeholder="Rechercher par nom ou téléphone..."
                                className="pl-14 h-9 text-lg font-bold rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <ScrollArea className="h-[350px] pr-4 -mr-4">
                            <div className="space-y-2">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                        <Users className="h-12 w-12 animate-pulse" />
                                        <p className="text-xs font-bold uppercase mt-4">Chargement...</p>
                                    </div>
                                ) : filteredCustomers.length > 0 ? (
                                    filteredCustomers.map(c => (
                                        <div 
                                            key={c.uuid}
                                            onClick={() => handleSelect(c.uuid)}
                                            className="group flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer shadow-inner"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 rounded-xl bg-background border border-white/5 shadow-sm group-hover:scale-110 transition-transform">
                                                    <User className="h-5 w-5 text-primary/60" />
                                                </div>
                                                <div className="flex flex-col -space-y-0.5">
                                                    <p className="font-bold text-sm tracking-tight">{c.firstName} {c.lastName}</p>
                                                    <p className="text-[10px] font-mono text-muted-foreground/50">{c.phone || 'Sans téléphone'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {c.outstandingBalance > 0 && (
                                                    <div className="text-right px-4 border-r border-white/5">
                                                        <p className="text-[8px] font-bold uppercase text-destructive/50">Dette antérieure</p>
                                                        <p className="text-sm font-black text-destructive tracking-tighter">{formatCurrency(c.outstandingBalance)}</p>
                                                    </div>
                                                )}
                                                <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-all" />
                                            </div>
                                        </div>
                                    ))
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
                            onClick={() => handleSelect(null)}
                            className="flex-1 h-9 rounded-2xl font-bold text-[10px] uppercase tracking-wide gap-2 hover:bg-destructive/5 hover:text-destructive"
                        >
                            <UserX className="h-4 w-4" /> Client de passage
                        </Button>
                        <Button 
                            onClick={() => setIsAddDialogOpen(true)}
                            className="flex-1 h-9 rounded-2xl font-bold text-[10px] uppercase tracking-wide gap-2 shadow-xl shadow-sm"
                        >
                            <UserPlus className="h-4 w-4" /> Nouveau Client +
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
