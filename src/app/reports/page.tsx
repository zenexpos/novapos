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
 * Page de rapports simplifiée.
 */
export default function ReportsPage() {
    const [isMounted, setIsMounted] = useState(false);
    const statsResult = useLiveQuery(() => reportsService.getPeriodPerformance(30), []);
    const valuationResult = useLiveQuery(() => reportsService.getInventoryValuation(), []);

    useEffect(() => {
        setIsMounted(true);
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
            <div className="h-full flex items-center justify-center opacity-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-4 space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="Rapports et Analyses" 
                description="Suivez vos ventes, vos dépenses et votre stock"
                icon={ChartBar}
            >
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 border-primary/20 hover:bg-primary/5 gap-2 px-6">
                        <Printer className="h-4 w-4" /> Imprimer résumé
                    </Button>
                    <Button className="rounded-xl h-11 shadow-xl gap-2 px-6">
                        <FileSpreadsheet className="h-4 w-4" /> Exporter Excel
                    </Button>
                </div>
            </PageHeader>

            {/* KPIs Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReportCard 
                    label="Recettes du jour" 
                    icon={CalendarCheck} 
                    color="bg-primary" 
                    value={formatCurrency(stats?.totalIn || 0)}
                    desc="Argent encaissé aujourd'hui"
                    onClick={handleGenerateZReport}
                />
                <ReportCard 
                    label="Valeur du stock" 
                    icon={Target} 
                    color="bg-emerald-500" 
                    value={formatCurrency(valuation?.atRetail || 0)}
                    desc="Valeur de vente de vos articles"
                />
                <ReportCard 
                    label="Bénéfice net" 
                    icon={TrendingUp} 
                    color="bg-blue-500" 
                    value={formatCurrency(stats?.cashFlow || 0)}
                    desc="Recettes moins les dépenses"
                />
                <ReportCard 
                    label="Taux de dépense" 
                    icon={PieChart} 
                    color="bg-amber-500" 
                    value={`${stats?.expenseRatio.toFixed(1)}%`}
                    desc="Poids des dépenses sur vos revenus"
                />
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8 app-card border-white/5 bg-card/40 backdrop-blur-sm">
                    <CardHeader className="p-6 border-b border-white/5 bg-muted/20">
                        <CardTitle className="text-xl font-bold tracking-tighter uppercase">Activité des 30 derniers jours</CardTitle>
                        <CardDescription className="text-xs">Ventes, dépenses et paiements clients.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-8">
                             <div className="flex items-center justify-between p-6 bg-black/20 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Profit attendu en stock</p>
                                    <p className="text-3xl font-black text-emerald-500 tabular-nums">
                                        {formatCurrency(valuation?.potentialProfit || 0)}
                                    </p>
                                </div>
                                <ArrowUpRight className="h-10 w-10 text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors" />
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl border border-white/5 bg-muted/10">
                                    <div className="flex items-center gap-2 mb-2 text-primary">
                                        <Wallet className="h-3.5 w-3.5" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Coût du stock</p>
                                    </div>
                                    <p className="text-lg font-bold tabular-nums">{formatCurrency(valuation?.atCost || 0)}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-white/5 bg-muted/10">
                                    <div className="flex items-center gap-2 mb-2 text-emerald-500">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Total entrées</p>
                                    </div>
                                    <p className="text-lg font-bold tabular-nums">{formatCurrency(stats?.totalIn || 0)}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-white/5 bg-muted/10">
                                    <div className="flex items-center gap-2 mb-2 text-destructive">
                                        <TrendingDown className="h-3.5 w-3.5" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Total dépenses</p>
                                    </div>
                                    <p className="text-lg font-bold tabular-nums">{formatCurrency(stats?.totalOut || 0)}</p>
                                </div>
                             </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="lg:col-span-4 space-y-6">
                    <Card className="app-card border-white/5 bg-primary/5 shadow-xl group overflow-hidden">
                        <CardHeader className="p-6 relative z-10">
                            <Target className="h-10 w-10 text-primary mb-4 group-hover:rotate-12 transition-transform" />
                            <CardTitle className="text-xl font-black tracking-tight uppercase">Clôture de caisse</CardTitle>
                            <CardDescription className="text-xs font-medium leading-relaxed mt-2">
                                Vérifiez que l'argent dans votre tiroir-caisse correspond aux ventes enregistrées.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 relative z-10">
                            <Button 
                                onClick={handleGenerateZReport}
                                className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                            >
                                Faire la clôture (Z)
                            </Button>
                        </CardContent>
                        <Activity className="absolute -right-6 -bottom-6 h-32 w-32 text-primary/5 rotate-12" />
                    </Card>
                    
                    <div className="p-6 bg-black/20 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-4">
                        <Clock className="h-8 w-8 text-muted-foreground/20" />
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">Rapport généré le</p>
                        <p className="text-xs font-bold text-primary">{new Date().toLocaleString('fr-FR')}</p>
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
                    <div className={cn("p-2.5 rounded-xl text-white shadow-lg transition-transform group-hover:rotate-6", color)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter opacity-40">En direct</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-[0.15em]">{label}</h3>
                <p className="text-2xl font-black tracking-tighter mb-2 group-hover:text-primary transition-colors tabular-nums">{value}</p>
                <p className="text-[10px] text-muted-foreground/60 font-medium leading-relaxed">{desc}</p>
            </CardContent>
            <div className="p-4 bg-muted/10 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-muted-foreground/40 flex items-center gap-1.5 uppercase">
                    <Clock className="h-3 w-3" /> Mis à jour
                </span>
                <Download className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </Card>
    );
}
