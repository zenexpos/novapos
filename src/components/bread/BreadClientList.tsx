'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Edit, Users, Wheat, Star, ChevronRight, UserCheck } from 'lucide-react';
import { BreadClientForm } from './BreadClientForm';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BreadClientListProps {
    onListChange: () => void;
}

export function BreadClientList({ onListChange }: BreadClientListProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [clients, setClients] = useState<Customer[] | undefined>(undefined);

    const fetchClients = useCallback(async () => {
        try {
            const data = await customerService.filterCustomers({ status: 'is_bread_client' });
            setClients(data);
        } catch (error: any) {
            toast.error("Impossible de charger les clients de pain.");
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);
    
    const handleFormSuccess = () => {
        fetchClients();
        onListChange(); 
    }

    const isLoading = clients === undefined;

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsFormOpen(true);
    };

    const getRecurrenceBadge = (client: Customer) => {
        if (!client.isBreadClient) return null;
        
        switch (client.breadRecurrenceType) {
            case 'quotidien':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-semibold uppercase px-2 py-0.5">QUOTIDIEN</Badge>;
            case 'jours_specifiques':
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px] font-semibold uppercase px-2 py-0.5">PROGRAMMÉ</Badge>;
            case 'aucun':
                return <Badge variant="outline" className="bg-muted/20 text-muted-foreground/60 border-white/5 text-[8px] font-semibold uppercase px-2 py-0.5">MANUEL</Badge>;
            default:
                return null;
        }
    }

    return (
        <>
            <Card className="flex flex-col h-full rounded-lg border-none shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden group">
                <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sm">
                            <Star className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-semibold tracking-tight">Abonnés Elite</CardTitle>
                            <p className="text-[9px] font-semibold uppercase text-primary/50 mt-1">Membres du programme Pain</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow min-h-0 p-6">
                    <ScrollArea className="h-full pr-4 -mr-4">
                        <div className="space-y-3">
                            {isLoading && [...Array(6)].map((_, i) => <Skeleton className="h-20 w-full rounded-3xl bg-white/5 animate-pulse" />)}
                            
                            {!isLoading && clients?.map(client => (
                                <div 
                                    key={client.uuid} 
                                    onClick={() => handleEdit(client)}
                                    className="group/item flex items-center p-4 rounded-lg bg-black/20 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-500 cursor-pointer shadow-inner"
                                >
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-sm tracking-tight truncate group-hover/item:text-primary transition-colors">
                                            {client.firstName} {client.lastName}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            {getRecurrenceBadge(client)}
                                            {client.breadRecurrenceType === 'quotidien' && (
                                                <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wide">×{client.breadDefaultQuantity} pcs</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground/20 group-hover/item:text-primary group-hover/item:bg-primary/10 transition-all">
                                        <ChevronRight className="h-5 w-5" />
                                    </div>
                                </div>
                            ))}

                             {!isLoading && clients?.length === 0 && (
                                <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                                    <Wheat className="h-12 w-12" />
                                    <p className="text-[10px] font-semibold uppercase ">Aucun abonné</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <div className="p-6 bg-primary/5 border-t border-white/5">
                    <div className="flex items-center justify-center gap-2 text-emerald-500 font-semibold text-[9px] uppercase tracking-wide bg-emerald-500/10 py-3 rounded-2xl border border-emerald-500/20">
                        <UserCheck className="h-3.5 w-3.5" /> Système Actif & Sécurisé
                    </div>
                </div>
            </Card>

            <BreadClientForm 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                customer={selectedCustomer}
                onSuccess={handleFormSuccess}
            />
        </>
    );
}