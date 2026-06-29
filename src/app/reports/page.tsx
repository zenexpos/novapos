'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    ChartBar, 
    PieChart, 
    TrendingUp, 
    CalendarCheck, 
    Download, 
    Printer,
    FileSpreadsheet,
    Clock,
    Target,
    ArrowUpRight,
    Loader2,
    Wallet,
    TrendingDown,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { reportsService } from '@/services/finance/reports.service';
import { closingService } from '@/services/finance/closing.service';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Enterprise Reports Page.
 * PRODUCTION AUDIT: Hardened hydration guards to prevent SSR mismatch on dynamic timestamps.
 */
export default function ReportsPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState<string | null>(null);

    const statsResult = useLiveQuery(() => reportsService.getPeriodPerformance(30), []);
    const valuationResult = useLiveQuery(() => reportsService.getInventoryValuation(), []);

    useEffect(() => {
        setIsMounted(true);
        // Defer time-sensitive operations to client mount to avoid hydration mismatch
        setCurrentTime(new Date().toLocaleString('fr-FR'));
        
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleString('fr-FR'));
        }, 60000);
        
        return () => clearInterval(timer);
    }, []);

    const stats = statsResult.value;
    const valuation = valuationResult.value;
    const isLoading = statsResult.isLoading || valuationResult.isLoading || !isMounted;

    const handleGenerateZReport = async () => {
        toast.promise(closingService.generateDailyZReport(), {
            loading: 'Calcul de la clôture du jour...',
            success: 'Rapport généré avec succès',
            error: 'Erreur lors du calcul'
        });
    };

    if (!isMounted) {
        return (
            <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
                <Skeleton className="h-12 w-64 rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
                </div>
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center opacity-20 py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-4 space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-1000 pb-24">
            <PageHeader 
                title="Rapports & Intelligence" 
                description="Analytique stratégique de votre écosystème commercial"
                icon={ChartBar}
            >
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all gap-2 px-6">
                        <Printer className="h-4 w-4" /> Imprimer résumé
                    </Button>
                    <Button className="rounded-xl h-11 shadow-xl gap-2 px-6">
                        <FileSpreadsheet className="h-4 w-4" /> Exporter Excel
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReportCard 
                    label="Recettes (30j)" 
                    icon={CalendarCheck} 
                    color="bg-primary" 
                    value={formatCurrency(stats?.totalIn || 0)}
                    desc="Flux de liquidité entrant cumulé"
                    onClick={handleGenerateZReport}
                />
                <ReportCard 
                    label="Actifs Stock" 
                    icon={Target} 
                    color="bg-emerald-500" 
                    value={formatCurrency(valuation?.atRetail || 0)}
                    desc="Valeur marchande actuelle"
                />
                <ReportCard 
                    label="Profit Net" 
                    icon={TrendingUp} 
                    color="bg-blue-500" 
                    value={formatCurrency(stats?.cashFlow || 0)}
                    desc="Bénéfice opérationnel après charges"
                />
                <ReportCard 
                    label="Indice de Charge" 
                    icon={PieChart} 
                    color="bg-amber-500" 
                    value={`${stats?.expenseRatio.toFixed(1)}%`}
                    desc="Poids des dépenses sur le CA"
                />
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8 app-card border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="p-6 border-b border-white/5 bg-muted/20">
                        <CardTitle className="text-xl font-black tracking-tighter uppercase">Analyse des Flux (30 derniers jours)</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/50">Synthèse transactionnelle Elite</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-8">
                             <div className="flex items-center justify-between p-6 bg-black/20 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all shadow-inner">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Projection Profit Marchandise</p>
                                    <p className="text-3xl font-black text-emerald-500 tabular-nums tracking-tighter">
                                        {formatCurrency(valuation?.potentialProfit || 0)}
                                    </p>
                                </div>
                                <ArrowUpRight className="h-10 w-10 text-emerald-500/10 group-hover:text-emerald-500/40 transition-colors" />
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 rounded-2xl border border-white/5 bg-muted/10 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3 text-primary">
                                        <Wallet className="h-4 w-4" />
                                        <p className="text-[9px] font-black uppercase tracking-widest">Investissement Stock</p>
                                    </div>
                                    <p className="text-xl font-black tabular-nums tracking-tight">{formatCurrency(valuation?.atCost || 0)}</p>
                                </div>
                                <div className="p-5 rounded-2xl border border-white/5 bg-muted/10 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3 text-emerald-500">
                                        <TrendingUp className="h-4 w-4" />
                                        <p className="text-[9px] font-black uppercase tracking-widest">Total Entrées</p>
                                    </div>
                                    <p className="text-xl font-black tabular-nums tracking-tight">{formatCurrency(stats?.totalIn || 0)}</p>
                                </div>
                                <div className="p-5 rounded-2xl border border-white/5 bg-muted/10 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3 text-destructive">
                                        <TrendingDown className="h-4 w-4" />
                                        <p className="text-[9px] font-black uppercase tracking-widest">Total Charges</p>
                                    </div>
                                    <p className="text-xl font-black tabular-nums tracking-tight">{formatCurrency(stats?.totalOut || 0)}</p>
                                </div>
                             </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="lg:col-span-4 space-y-6">
                    <Card className="app-card border-white/5 bg-primary/5 shadow-xl group overflow-hidden">
                        <CardHeader className="p-6 relative z-10">
                            <Target className="h-10 w-10 text-primary mb-4 group-hover:rotate-12 transition-transform" />
                            <CardTitle className="text-xl font-black tracking-tight uppercase">Clôture de Caisse (Z)</CardTitle>
                            <CardDescription className="text-xs font-bold leading-relaxed mt-2 opacity-60">
                                Validation quotidienne de l'intégrité des flux de trésorerie physique.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 relative z-10">
                            <Button 
                                onClick={handleGenerateZReport}
                                className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                            >
                                Exécuter la clôture
                            </Button>
                        </CardContent>
                        <Activity className="absolute -right-6 -bottom-6 h-32 w-32 text-primary/5 rotate-12" />
                    </Card>
                    
                    <div className="p-6 bg-black/20 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-4 shadow-inner">
                        <Clock className="h-8 w-8 text-muted-foreground/10" />
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase text-muted-foreground/30 tracking-[0.3em]">Signature temporelle</p>
                            <p className="text-xs font-black text-primary uppercase tracking-tighter">
                                {currentTime || 'Initialisation...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReportCard({ label, icon: Icon, color, value, desc, onClick }: any) {
    return (
        <Card 
            className="app-card group hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden border-white/5 bg-card/40 backdrop-blur-sm"
            onClick={onClick}
        >
            <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
                <div className="flex items-center justify-between">
                    <div className={cn("p-3 rounded-2xl text-white shadow-lg transition-transform group-hover:rotate-6", color)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter opacity-30">Audit direct</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <h3 className="text-[10px] font-black text-muted-foreground/50 uppercase mb-2 tracking-[0.15em]">{label}</h3>
                <p className="text-2xl font-black tracking-tighter mb-2 group-hover:text-primary transition-colors tabular-nums">{value}</p>
                <p className="text-[10px] text-muted-foreground/60 font-medium leading-relaxed">{desc}</p>
            </CardContent>
            <div className="p-4 bg-muted/10 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-muted-foreground/20 flex items-center gap-2 uppercase tracking-widest">
                    <Clock className="h-3 w-3" /> État synchronisé
                </span>
                <Download className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </Card>
    );
}