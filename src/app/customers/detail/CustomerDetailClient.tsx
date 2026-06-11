'use client';
import React from 'react';
import type { Sale, Payment, ProductReturn, Customer } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, 
    HandCoins, 
    Printer, 
    Loader2, 
    RefreshCw, 
    Wheat, 
    Settings, 
    MessageCircle, 
    PhoneCall, 
    MapPin, 
    Phone,
    User,
    Sparkles,
    History,
    Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
import { CustomerSpendingChart } from '@/components/customers/CustomerSpendingChart';
import { useState, useCallback, useEffect } from 'react';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import { PrintStatementDialog } from '@/components/customers/PrintStatementDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { customerService } from '@/services/customer.service';
import { salesService } from '@/services/sales.service';
import { returnService } from '@/services/return.service';
import { BreadClientForm } from '@/components/bread/BreadClientForm';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

export default function CustomerDetailClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const customerUuid = searchParams.get('uuid');

    const [customer, setCustomer] = useState<Customer | undefined | null>(undefined);
    const [spendingData, setSpendingData] = useState<{ month: string, total: number }[]>([]);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    const [isBreadDialogOpen, setIsBreadDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isReturnDetailsOpen, setIsReturnDetailsOpen] = useState(false);

    // FIX: Typed union replaces activity: any[] — eliminates any-casting
    type ActivityItem =
        | ({ type: 'sale';    date: Date } & Sale)
        | ({ type: 'payment'; date: Date } & Payment)
        | ({ type: 'return';  date: Date } & ProductReturn)
        | { type: 'initial_balance'; date: Date; uuid: string; amount: number; notes: string };

    // FIX: useReducer replaces two separate useState calls — eliminates double render on reset
    const [activityState, dispatchActivity] = React.useReducer(
        (state: { items: ActivityItem[]; page: number }, action:
            | { type: 'reset' }
            | { type: 'append'; payload: ActivityItem[] }
            | { type: 'next_page' }
        ) => {
            switch (action.type) {
                case 'reset':     return { items: [], page: 1 };
                case 'append':    return { ...state, items: state.page === 1 ? action.payload : [...state.items, ...action.payload] };
                case 'next_page': return { ...state, page: state.page + 1 };
                default:          return state;
            }
        },
        { items: [], page: 1 }
    );
    const activity      = activityState.items;
    const activityPage  = activityState.page;
    const [isLoadingActivity, setIsLoadingActivity] = useState(true);
    const [hasMoreActivity, setHasMoreActivity] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchCustomerData = useCallback(async () => {
        if (!customerUuid) {
            router.push('/customers');
            return;
        }
        setIsRefreshing(true);
        try {
            const [cust, spending] = await Promise.all([
                customerService.getCustomerByUuid(customerUuid),
                customerService.getCustomerMonthlySpending(customerUuid)
            ]);
            setCustomer(cust);
            setSpendingData(spending);
            if (!cust) {
                toast.error("Client non trouvé.");
            }
        } catch (error: any) {
            toast.error("Échec du chargement des données.");
            setCustomer(null);
        } finally {
            setIsRefreshing(false);
        }
    }, [customerUuid, router]);
    
    useEffect(() => {
        fetchCustomerData();
    }, [fetchCustomerData]);

    const handleSuccessfulPayment = useCallback(async () => {
        toast.success("Paiement enregistré.");
        await fetchCustomerData();
        refreshActivity();
    }, [fetchCustomerData]);

    const refreshActivity = useCallback(() => {
        dispatchActivity({ type: 'reset' });
        setHasMoreActivity(true);
        setIsLoadingActivity(true);
    }, []);

    useEffect(() => {
        if (!customerUuid || !hasMoreActivity) return;

        let isCancelled = false;
        setIsLoadingActivity(true);
        customerService.getCustomerActivity(customerUuid, activityPage, ITEMS_PER_PAGE)
            .then(newActivity => {
                if (!isCancelled) {
                    dispatchActivity({ type: 'append', payload: newActivity as ActivityItem[] });
                    if (newActivity.length < ITEMS_PER_PAGE) {
                        setHasMoreActivity(false);
                    }
                }
            })
            .catch(() => toast.error("Erreur de chargement de l'activité."))
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingActivity(false);
                }
            });
        
        return () => { isCancelled = true; };
    }, [customerUuid, activityPage, hasMoreActivity]);

    const handleLoadMore = () => {
        if (!isLoadingActivity && hasMoreActivity) {
            dispatchActivity({ type: 'next_page' });
        }
    };

    const handleSaleClick = useCallback(async (sale: Sale) => {
        try {
            const saleWithItems = await salesService.getSaleByUuid(sale.uuid);
            if (!saleWithItems) {
                toast.error("Détails introuvables.");
                return;
            }
            setSelectedSale(saleWithItems);
            setIsSaleDetailsOpen(true);
        } catch (error: any) {
            toast.error("Erreur lors de la lecture.");
        }
    }, []);

    const handleReturnClick = useCallback(async (pr: ProductReturn) => {
        try {
            const returnWithItems = await returnService.getReturnByUuid(pr.uuid);
             if (!returnWithItems) {
                toast.error("Détails introuvables.");
                return;
            }
            setSelectedReturn(returnWithItems);
            setIsReturnDetailsOpen(true);
        } catch (error: any) {
            toast.error("Erreur lors de la lecture.");
        }
    }, []);

    const handleWhatsApp = () => {
        if (!customer?.phone) return;
        const message = encodeURIComponent(`Bonjour ${customer.firstName}, votre solde actuel est de ${formatCurrency(customer.outstandingBalance)}. Cordialement.`);
        window.open(`https://wa.me/${customer.phone}?text=${message}`, '_blank');
    };

    if (customer === undefined) {
        return (
             <div className="p-4 space-y-4 max-w-[1800px] mx-auto animate-pulse">
                <div className="flex gap-4 items-center">
                    <Skeleton className="h-9 w-14 rounded-2xl bg-card/40" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 rounded-xl bg-card/40" />
                        <Skeleton className="h-4 w-40 rounded-xl bg-card/40" />
                    </div>
                </div>
                <div className="grid lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-8 space-y-4">
                        <Skeleton className="h-96 w-full rounded-lg bg-card/40" />
                        <Skeleton className="h-[500px] w-full rounded-lg bg-card/40" />
                    </div>
                    <div className="lg:col-span-4 space-y-4">
                        <Skeleton className="h-64 w-full rounded-lg bg-card/40" />
                        <Skeleton className="h-9 w-full rounded-2xl bg-card/40" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!customer) {
        return (
            <div className="p-20 text-center flex flex-col items-center gap-6">
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
                    <User className="h-9 w-16" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-xl font-semibold tracking-tighter">Client non identifié</h1>
                    <p className="text-muted-foreground font-medium">Ce dossier n'existe pas ou a été révoqué.</p>
                </div>
                <Link
                    href="/customers"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl h-14 px-4 font-bold border border-white/5 bg-card/40 hover:bg-primary/10 transition-all"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour au fichier
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
             <div className="flex items-center gap-6">
                 <Button variant="outline" size="icon" className="h-9 w-14 rounded-2xl border-white/5 bg-card/40 backdrop-blur-md transition-all active:scale-90" asChild>
                    <Link href="/customers"><ArrowLeft className="h-6 w-6" /></Link>
                 </Button>
                 <div className="flex-grow">
                    <PageHeader 
                        title={`${customer.firstName} ${customer.lastName}`}
                        description={`Membre Elite • ID: ${customer.uuid.substring(0,8)}`}
                        className="mb-0"
                    />
                 </div>
                 <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={fetchCustomerData} 
                    className="h-9 w-14 rounded-2xl border-white/5 bg-card/40 backdrop-blur-md group"
                    disabled={isRefreshing}
                 >
                    <RefreshCw className={cn("h-6 w-6 text-primary transition-all duration-1000", isRefreshing && "animate-spin")} />
                 </Button>
            </div>

            <div className="grid lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-8 space-y-4">
                     <div className="animate-in slide-in-from-left-4 duration-700">
                        <CustomerSpendingChart data={spendingData} />
                     </div>

                     <Card className="app-card bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden rounded-lg animate-in slide-in-from-bottom-4 duration-700 delay-200">
                        <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-semibold tracking-tighter">Historique de Flux</CardTitle>
                                    <CardDescription className="text-[10px] font-semibold uppercase text-primary/50">Ventes, Retours & Encaissements</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                           {isLoadingActivity && activity.length === 0 ? (
                                <div className="flex flex-col justify-center items-center h-60 opacity-20">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                                    <p className="text-[10px] font-semibold uppercase tracking-wide">Récupération des données...</p>
                                </div>
                            ) : (
                                <CustomerActivity 
                                    activity={activity} 
                                    onSaleClick={handleSaleClick}
                                    onReturnClick={handleReturnClick}
                                />
                            )}
                        </CardContent>
                        {hasMoreActivity && (
                            <CardFooter className="bg-muted/10 border-t border-white/5 p-4">
                                <Button onClick={handleLoadMore} variant="ghost" className="w-full h-9 font-semibold uppercase text-[10px] text-primary hover:bg-primary/5" disabled={isLoadingActivity}>
                                    {isLoadingActivity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Charger plus de transactions
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-4 sticky top-24">
                    <div className="animate-in slide-in-from-right-4 duration-700">
                        <CustomerMetrics customer={customer} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Button 
                            variant="outline" 
                            className="rounded-2xl h-9 gap-3 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all font-semibold text-[10px] uppercase tracking-wide shadow-xl"
                            onClick={handleWhatsApp}
                            disabled={!customer.phone}
                        >
                            <MessageCircle className="h-5 w-5" /> WhatsApp
                        </Button>
                        <Button 
                            variant="outline" 
                            className="rounded-2xl h-9 gap-3 border-blue-500/20 bg-blue-500/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-semibold text-[10px] uppercase tracking-wide shadow-xl"
                            asChild
                            disabled={!customer.phone}
                        >
                            <a href={`tel:${customer.phone}`}>
                                <PhoneCall className="h-5 w-5" /> Appeler
                            </a>
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button 
                            variant="outline"
                            size="lg" 
                            className="w-full rounded-lg h-20 font-semibold border-white/5 bg-card/40 backdrop-blur-md shadow-sm gap-3 text-[10px] uppercase tracking-wide group"
                            onClick={() => setIsStatementDialogOpen(true)}
                        >
                            <Printer className="h-6 w-6 text-primary opacity-40 group-hover:opacity-100 transition-opacity" /> 
                            <span>Générer<br/>Relevé</span>
                        </Button>
                        <Button 
                            size="lg" 
                            className="w-full rounded-lg h-20 font-semibold shadow-sm gap-3 text-[10px] uppercase tracking-wide transition-all active:scale-95"
                            onClick={() => setIsPaymentDialogOpen(true)}
                            disabled={customer.outstandingBalance <= 0}
                        >
                            <HandCoins className="h-6 w-6" /> 
                            <span>Effectuer<br/>Paiement</span>
                        </Button>
                    </div>

                    <div className="p-4 bg-muted/20 rounded-lg border border-white/5 space-y-6 shadow-inner relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000">
                            <MapPin className="h-40 w-40" />
                        </div>
                        <h4 className="text-[10px] font-semibold uppercase text-muted-foreground/60 border-b border-white/5 pb-4">Coordonnées de Contact</h4>
                        <div className="space-y-6 text-sm relative z-10">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-background/50 shadow-inner">
                                    <Phone className="h-4 w-4 text-primary/60" />
                                </div>
                                <div className="flex flex-col -space-y-0.5">
                                    <span className="text-[9px] uppercase font-semibold text-muted-foreground/40 tracking-wide">Mobile</span>
                                    <span className="font-semibold text-base">{customer.phone || '-'}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-background/50 shadow-inner">
                                    <MapPin className="h-4 w-4 text-primary/60" />
                                </div>
                                <div className="flex flex-col -space-y-0.5">
                                    <span className="text-[9px] uppercase font-semibold text-muted-foreground/40 tracking-wide">Adresse Physique</span>
                                    <span className="font-semibold text-base leading-tight">{customer.address || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section spécifique pour le solde initial */}
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 space-y-3 shadow-inner group">
                        <div className="flex items-center gap-3 text-primary">
                            <History className="h-4 w-4" />
                            <h4 className="text-[10px] font-semibold uppercase tracking-wide">Situation de Départ</h4>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-primary">{formatCurrency(customer.initialBalance)}</span>
                        </div>
                    </div>

                    <Card className={cn(
                        "rounded-lg border-none shadow-xl overflow-hidden group transition-all duration-500",
                        customer.isBreadClient ? "bg-primary/10 border border-primary/20" : "bg-card/20 opacity-40 hover:opacity-100"
                    )}>
                        <CardHeader className="pb-4 p-4 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2.5 rounded-xl transition-colors",
                                        customer.isBreadClient ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Wheat className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-sm font-semibold uppercase ">Service de Pain</CardTitle>
                                </div>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10" onClick={() => setIsBreadDialogOpen(true)}>
                                    <Settings className="h-5 w-5 opacity-40" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {customer.isBreadClient ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-semibold uppercase text-primary/60 tracking-wide">Récurrence</p>
                                            <p className="font-semibold text-sm">{customer.bread_type_recurrence === 'quotidien' ? 'QUOTIDIEN' : 'PROGRAMMÉ'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-semibold uppercase text-primary/60 tracking-wide">Quantité</p>
                                            <p className="font-semibold text-sm">{customer.bread_type_recurrence === 'quotidien' ? `${customer.bread_quantite_defaut} PCS` : 'VARIABLE'}</p>
                                        </div>
                                    </div>
                                    {customer.bread_date_debut && (
                                        <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-primary/40" />
                                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                                                Depuis le {format(new Date(customer.bread_date_debut), 'd MMMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-center opacity-40">Aucun abonnement actif</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            
             {customer && (
                <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={customer}
                    onPaymentSuccess={handleSuccessfulPayment}
                />
            )}

            <PrintStatementDialog
                isOpen={isStatementDialogOpen}
                onOpenChange={setIsStatementDialogOpen}
                customer={customer}
            />

            <SaleDetailsDialog
                isOpen={isSaleDetailsOpen}
                onOpenChange={setIsSaleDetailsOpen}
                sale={selectedSale}
            />
            <ReturnDetailsDialog
                isOpen={isReturnDetailsOpen}
                onOpenChange={setIsReturnDetailsOpen}
                productReturn={selectedReturn}
            />
            
            <BreadClientForm 
                isOpen={isBreadDialogOpen}
                onOpenChange={setIsBreadDialogOpen}
                customer={customer}
                onSuccess={fetchCustomerData}
            />
        </div>
    );
}
