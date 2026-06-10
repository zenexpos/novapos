'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/utils';
import { addDays, format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BreadStats } from '@/components/bread/BreadStats';
import { BreadOrderTable } from '@/components/bread/BreadOrderTable';
import { BreadOrderForm } from '@/components/bread/BreadOrderForm';
import { 
    Loader2, 
    RefreshCw, 
    ChevronLeft, 
    ChevronRight, 
    CalendarDays, 
    Plus,
    Search,
    FilterX,
    Clock
} from 'lucide-react';
import { breadService } from '@/services/bread.service';
import type { BreadOrderWithCustomer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

/**
 * Page de gestion avancée du pain (Système Elite).
 */
export default function BreadPage() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isProcessingTransfers, setIsProcessingTransfers] = useState(false);

    const formattedDate = formatDateToYYYYMMDD(currentDate);

    const ordersResult = useLiveQuery<BreadOrderWithCustomer[] | undefined>(
        async () => await breadService.generateAndGetOrdersForDate(formattedDate),
        [formattedDate],
        undefined
    );

    const filteredOrders = useMemo(() => {
        if (!ordersResult.value) return [];
        let list = ordersResult.value;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(o => 
                o.orderNumber.toLowerCase().includes(q) ||
                (o.customer && (o.customer.firstName + ' ' + o.customer.lastName).toLowerCase().includes(q)) ||
                (o.customName && o.customName.toLowerCase().includes(q))
            );
        }
        return list;
    }, [ordersResult.value, searchQuery]);

    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    }, []);

    const runAutomatedTask = async () => {
        setIsProcessingTransfers(true);
        try {
            const count = await breadService.processEndOfDayTransfers();
            if (count > 0) toast.success(`${count} طلبات محولة للحسابات بنجاح.`);
            else toast.info("لا توجد طلبات معلقة للتحويل حالياً.");
        } finally {
            setIsProcessingTransfers(false);
        }
    };

    useKeyboardShortcuts([
        { key: 'ArrowLeft', action: () => handleDateChange(-1), description: 'Jour précédent', ignoreInputFocus: true },
        { key: 'ArrowRight', action: () => handleDateChange(1), description: 'Jour suivant', ignoreInputFocus: true },
        { key: 'n', action: () => setIsFormOpen(true), description: 'Nouveau طلب', ignoreInputFocus: false }
    ], 'Pain');

    return (
        <div className="p-6 space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-700">
            <PageHeader 
                title="نظام إدارة طلبات الخبز Elite"
                description={format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            >
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={runAutomatedTask}
                        disabled={isProcessingTransfers}
                        className="rounded-xl border-amber-500/20 bg-amber-500/5 text-amber-600 gap-2 hover:bg-amber-500/10"
                    >
                        {isProcessingTransfers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                        تشغيل الأتمتة الليلية
                    </Button>

                    <div className="flex gap-1 bg-black/20 p-1 rounded-2xl border border-white/5 shadow-inner">
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(-1)} className="rounded-xl h-9 w-9">
                            <ChevronLeft className="h-5 w-5 text-primary" />
                        </Button>
                        <Button 
                            variant={formattedDate === formatDateToYYYYMMDD(new Date()) ? "secondary" : "ghost"} 
                            onClick={() => setCurrentDate(new Date())} 
                            className="rounded-xl h-9 px-4 text-[10px] uppercase font-bold"
                        >
                            Aujourd'hui
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)} className="rounded-xl h-9 w-9">
                            <ChevronRight className="h-5 w-5 text-primary" />
                        </Button>
                    </div>
                    
                    <Button onClick={() => setIsFormOpen(true)} className="rounded-2xl h-10 font-bold shadow-lg gap-2">
                        <Plus className="h-4 w-4" /> طلب جديد [N]
                    </Button>
                </div>
            </PageHeader>

            <BreadStats date={formattedDate} />

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input 
                        placeholder="Rechercher par client ou N° طلب..."
                        className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-card/40 backdrop-blur-sm rounded-lg border border-white/5 overflow-hidden min-h-[500px]">
                {ordersResult.isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[500px] opacity-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 font-bold uppercase tracking-widest">Chargement du registre...</p>
                    </div>
                ) : (
                    <BreadOrderTable orders={filteredOrders} />
                )}
            </div>

            <BreadOrderForm 
                isOpen={isFormOpen} 
                onOpenChange={setIsFormOpen} 
                currentDate={formattedDate}
            />
        </div>
    );
}
