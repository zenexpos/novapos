'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    Wheat, BellRing, CheckCircle2, Clock, 
    AlertTriangle, OctagonAlert, ArrowRight
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface DashboardWidgetsProps {
    type: 'bread' | 'alerts';
    data: any;
    isLoading: boolean;
    breadPrice?: number;
}

export function DashboardWidgets({ type, data, isLoading, breadPrice = 10 }: DashboardWidgetsProps) {
    if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl bg-card/40" />;

    if (type === 'bread') {
        return (
            <Card className="rounded-lg border-none shadow-xl bg-card/40 backdrop-blur-sm overflow-hidden group">
                <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/20 p-4">
                    <CardTitle className="text-[10px] font-black uppercase text-emerald-600 flex items-center justify-between tracking-widest">
                        <div className="flex items-center gap-2">
                            <Wheat className="h-4 w-4" /> Logistique Pain (Aujourd'hui)
                        </div>
                        <Link href="/bread" className="hover:underline flex items-center gap-1">
                            Gérer <ArrowRight className="h-2.5 w-2.5" />
                        </Link>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                            <p className="text-[8px] font-bold text-muted-foreground/40 uppercase">Total Pains</p>
                            <p className="text-xl font-black tabular-nums">{data?.totalQuantity ?? 0}<span className="text-[10px] ml-1 opacity-20">PCS</span></p>
                        </div>
                        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                            <p className="text-[8px] font-bold text-muted-foreground/40 uppercase">Flux Actifs</p>
                            <p className="text-xl font-black tabular-nums">{data?.totalOrders ?? 0}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <BreadMetric icon={CheckCircle2} label="Distribués" value={data?.deliveredCount ?? 0} color="text-emerald-500" total={data?.totalOrders ?? 1} />
                        <BreadMetric icon={Clock} label="En attente" value={(data?.totalOrders ?? 0) - (data?.deliveredCount ?? 0)} color="text-amber-500" total={data?.totalOrders ?? 1} />
                        <div className="h-px bg-white/5 my-4" />
                        <div className="flex justify-between items-center bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Paiements Validés ({data?.paidCount})</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-600">
                                {formatCurrency((data?.totalQuantity * breadPrice) - data?.remainingAmount)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-lg border-none shadow-xl bg-card/40 backdrop-blur-sm overflow-hidden group">
            <CardHeader className="bg-destructive/10 border-b border-destructive/20 p-4">
                <CardTitle className="text-[10px] font-black uppercase text-destructive flex items-center justify-between tracking-widest">
                    <div className="flex items-center gap-2">
                        <BellRing className="h-4 w-4 animate-pulse" /> Radar d'Alertes Elite
                    </div>
                    <span className="bg-destructive/20 px-2 py-0.5 rounded-full text-[8px]">{data?.length || 0}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                    {!data || data.length === 0 ? (
                        <div className="py-12 text-center space-y-4 opacity-20">
                            <CheckCircle2 className="h-10 w-10 mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Opérations en cours : RAS</p>
                        </div>
                    ) : (
                        data.map((alert: any) => (
                            <div key={alert.id} className="p-4 flex items-start gap-4 hover:bg-white/5 transition-colors">
                                <div className={cn(
                                    "p-2 rounded-xl shrink-0 mt-1 shadow-sm",
                                    alert.type === 'critical' ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                                )}>
                                    {alert.type === 'critical' ? <OctagonAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-black tracking-tight">{alert.message}</p>
                                    <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{alert.description}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function BreadMetric({ icon: Icon, label, value, color, total }: any) {
    const pct = Math.min(100, (value / (total || 1)) * 100);
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Icon className={cn("h-3 w-3", color)} />
                    <span className="text-[9px] font-bold uppercase text-muted-foreground/60">{label}</span>
                </div>
                <span className={cn("text-[10px] font-black tabular-nums", color)}>{value}</span>
            </div>
            <div className="h-1 w-full bg-muted/10 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-1000", color.replace('text', 'bg'))} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
