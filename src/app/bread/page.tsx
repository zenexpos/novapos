'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BreadClientList } from '@/components/bread/BreadClientList';
import { BreadDayView } from '@/components/bread/BreadDayView';
import { BreadStats } from '@/components/bread/BreadStats';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { breadService } from '@/services/bread.service';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

/**
 * Page de gestion de la logistique du pain.
 */
export default function BreadPage() {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setCurrentDate(new Date());
    }, []);

    const formattedDate = currentDate ? formatDateToYYYYMMDD(currentDate) : '';

    const checkAndGenerate = useCallback(async (date: string) => {
        if (!date) return;
        const count = await db.bread_orders.where('date').equals(date).count();
        if (count === 0) {
            await breadService.generateAndGetOrdersForDate(date);
        }
    }, []);

    useEffect(() => {
        if (isMounted && formattedDate) {
            checkAndGenerate(formattedDate);
        }
    }, [isMounted, formattedDate, checkAndGenerate]);

    const orders = useLiveQuery<BreadOrderWithCustomer[] | undefined>(
        async () => {
            if (!isMounted || !formattedDate) return undefined;
            return await breadService.generateAndGetOrdersForDate(formattedDate);
        },
        [isMounted, formattedDate],
        undefined,
    );

    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => prev ? addDays(prev, days) : null);
    }, []);

    const isToday = isMounted && currentDate && formatDateToYYYYMMDD(new Date()) === formattedDate;
    const isLoading = orders.value === undefined || !isMounted || !currentDate;

    // Raccourcis pour la navigation par jour
    useKeyboardShortcuts([
        {
            key: 'ArrowLeft',
            action: () => handleDateChange(-1),
            description: 'Jour précédent',
            ignoreInputFocus: true
        },
        {
            key: 'ArrowRight',
            action: () => handleDateChange(1),
            description: 'Jour suivant',
            ignoreInputFocus: true
        },
        {
            key: 'h',
            action: () => setCurrentDate(new Date()),
            description: 'Retour à aujourd\'hui',
            ignoreInputFocus: false
        }
    ], 'Distribution');

    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="Logistique du Pain Elite"
                description={isMounted && currentDate ? format(currentDate, 'EEEE d MMMM yyyy', { locale: fr }) : 'Synchronisation...'}
            >
                <div className="flex items-center gap-4">
                    <div className="flex gap-1.5 bg-black/20 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDateChange(-1)}
                            className="rounded-xl h-10 w-10 hover:bg-white/5"
                        >
                            <ChevronLeft className="h-5 w-5 text-primary" />
                        </Button>
                        <Button 
                            variant={isToday ? "secondary" : "ghost"} 
                            onClick={() => setCurrentDate(new Date())} 
                            disabled={isToday || !isMounted}
                            className={cn(
                                "rounded-xl h-10 px-6 font-semibold text-[10px] uppercase transition-all",
                                isToday ? "bg-primary text-primary-foreground shadow-lg" : "hover:text-primary"
                            )}
                        >
                            <CalendarDays className="mr-2 h-3.5 w-3.5" /> Aujourd'hui [H]
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDateChange(1)}
                            className="rounded-xl h-10 w-10 hover:bg-white/5"
                        >
                            <ChevronRight className="h-5 w-5 text-primary" />
                        </Button>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => formattedDate && checkAndGenerate(formattedDate)}
                        disabled={isLoading}
                        className="rounded-2xl h-9 w-14 border-white/5 bg-card hover:bg-primary/10 group transition-all duration-500"
                    >
                        <RefreshCw className={cn("h-6 w-6 text-primary transition-all duration-1000", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <div className="animate-in slide-in-from-top-4 duration-700">
                <BreadStats date={formattedDate} isLoading={isLoading}/>
            </div>

            <div className="grid lg:grid-cols-12 gap-4 items-stretch flex-grow min-h-0">
                <div className="lg:col-span-9 flex flex-col animate-in slide-in-from-left-4 duration-700 delay-200">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-[600px] bg-card/40 backdrop-blur-sm rounded-lg border border-white/5 animate-pulse">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full"></div>
                                <Loader2 className="relative h-12 w-12 animate-spin text-primary opacity-40" />
                            </div>
                            <p className="mt-6 text-[10px] font-semibold uppercase text-muted-foreground opacity-30">Initialisation du registre...</p>
                        </div>
                    ) : (
                        <BreadDayView 
                            orders={orders.value || []} 
                            currentDate={formattedDate}
                            onOrdersChange={() => {}} 
                        />
                    )}
                </div>

                <div className="lg:col-span-3 flex flex-col animate-in slide-in-from-right-4 duration-700 delay-300">
                    <BreadClientList onListChange={() => {}} />
                </div>
            </div>
        </div>
    );
}
