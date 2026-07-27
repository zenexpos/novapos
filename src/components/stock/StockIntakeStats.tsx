'use client';

import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Archive, Building, TrendingUp } from 'lucide-react';
import { formatCurrency, cn, safeNumber } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import type { StockIntake } from '@/lib/types';

interface StockIntakeStatsProps {
    intakes?: StockIntake[];
    isLoading?: boolean;
}

const StatCard = memo(({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: React.ElementType, colorClass: string, subtitle?: string }) => (
    <Card className="app-card h-full bg-card/40 border-white/5 rounded-lg group overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3 relative z-10">
            <CardTitle className="text-[9px] font-black uppercase text-muted-foreground group-hover:text-primary transition-all duration-500 tracking-widest">{title}</CardTitle>
            <div className={cn("p-1.5 rounded-lg shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-3.5 w-3.5" />
            </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 relative z-10">
            <div className="text-lg font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left tabular-nums">{value}</div>
            {subtitle && <p className="text-[8px] font-bold uppercase tracking-wide text-muted-foreground/30 mt-0.5">{subtitle}</p>}
        </CardContent>
    </Card>
));
StatCard.displayName = 'StatCard';

export const StockIntakeStats = memo(({ intakes: externalIntakes, isLoading: externalLoading }: StockIntakeStatsProps) => {
    const liveStatsResult = useLiveQuery<{
        totalValue: number;
        intakeCount: number;
        supplierCount: number;
    }>(async () => {
        if (externalIntakes && !externalLoading) {
            const totalValCents = externalIntakes.reduce((sum, i) => sum + Math.round(safeNumber(i.totalValue) * 100), 0);
            const supplierUuids = new Set(externalIntakes.map(i => i.supplierUuid).filter(Boolean));
            return {
                totalValue: totalValCents / 100,
                intakeCount: externalIntakes.length,
                supplierCount: supplierUuids.size,
            };
        }

        const intakeCount = await db.stock_intakes.count();
        let totalValCents = 0;
        const supplierUuidSet = new Set<string>();

        const chunkSize = 200;
        let offset = 0;

        while (true) {
            const batch = await db.stock_intakes
                .orderBy('id')
                .offset(offset)
                .limit(chunkSize)
                .toArray();

            if (batch.length === 0) break;

            for (const r of batch) {
                totalValCents += Math.round(safeNumber(r.totalValue) * 100);
                if (r.supplierUuid) supplierUuidSet.add(r.supplierUuid);
            }

            offset += batch.length;
            if (batch.length < chunkSize) break;
        }

        return {
            totalValue: totalValCents / 100,
            intakeCount,
            supplierCount: supplierUuidSet.size,
        };
    }, [externalIntakes, externalLoading]);

    const stats = liveStatsResult.value ?? { totalValue: 0, intakeCount: 0, supplierCount: 0 };

    if (liveStatsResult.value === undefined || externalLoading) {
        return (
             <div className="grid gap-2 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg bg-card/40 border border-white/5 animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-2 md:grid-cols-3 animate-in fade-in duration-700">
            <StatCard 
                title="Investissement" 
                value={formatCurrency(stats.totalValue)} 
                icon={TrendingUp} 
                colorClass="bg-emerald-500/10 text-emerald-500"
                subtitle="Valeur injectée"
            />
            <StatCard 
                title="Bons" 
                value={String(stats.intakeCount)} 
                icon={Archive} 
                colorClass="bg-primary/10 text-primary"
                subtitle="Opérations"
            />
            <StatCard 
                title="Partenaires" 
                value={String(stats.supplierCount)} 
                icon={Building} 
                colorClass="bg-amber-500/10 text-amber-500"
                subtitle="Fournisseurs"
            />
        </div>
    );
});
StockIntakeStats.displayName = 'StockIntakeStats';
