'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Archive, Building, TrendingUp, Sparkles } from 'lucide-react';
import { formatCurrency, cn, safeNumber } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';
import type { StockIntake } from '@/lib/types';

interface StockIntakeStatsProps {
    intakes?: StockIntake[];
    isLoading?: boolean;
}

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: React.ElementType, colorClass: string, subtitle?: string }) => (
    <Card className="app-card h-full bg-card/40 backdrop-blur-sm border-white/5 rounded-lg group overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-primary transition-all duration-500 tracking-widest">{title}</CardTitle>
            <div className={cn("p-3 rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 relative z-10">
            <div className="text-2xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left mb-1 tabular-nums">{value}</div>
            {subtitle && <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40">{subtitle}</p>}
        </CardContent>
        <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000">
            <Icon className="h-32 w-32 rotate-12" />
        </div>
    </Card>
);

export const StockIntakeStats = ({ intakes: externalIntakes, isLoading: externalLoading }: StockIntakeStatsProps) => {
    // Surveillance en direct des réceptions pour mettre à jour les stats instantanément
    // Important: ne pas charger toute la table (toArray). On calcule les stats uniquement.
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

        // Dexie ne propose pas de SUM direct -> on calcule uniquement à partir du minimum nécessaire.
        // لتجنب تحميل كل السجلات، نجمع القيمة على دفعات صغيرة باستخدام الفهرس المتاح.
        let totalValCents = 0;
        const supplierUuidSet = new Set<string>();

        // نقرأ فقط محددات المفاتيح (id) على دفعات بدون تحميل كامل الجدول.
        // ملاحظة: stock_intakes id هو ++id رقمية في المخطط.
        const cursor = db.stock_intakes
            .orderBy('id')
            .offset(0)
            .limit(1);

        // Dexie v4 يدعم where().above/below + offset/limit، لكن لا توجد primaryKeys بشكل موحد في كل الإصدارات.
        // سنعتمد بدل ذلك على cursor batching عبر قراءة حقول id فقط (باستخدام .toArray() على batch صغير).
        // chunkCount هو عدد الدُفعات، وليس عدد السجلات الكلي.
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
            // عند الوصول لنهاية الجدول نكسر.
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
             <div className="grid gap-6 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg bg-card/40 border border-white/5 animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-3 animate-in fade-in duration-700">
            <StatCard 
                title="Investissement Stock" 
                value={formatCurrency(stats.totalValue)} 
                icon={TrendingUp} 
                colorClass="bg-emerald-500/10 text-emerald-500"
                subtitle="Valeur totale injectée"
            />
            <StatCard 
                title="Bons de Réception" 
                value={String(stats.intakeCount)} 
                icon={Archive} 
                colorClass="bg-primary/10 text-primary"
                subtitle="Opérations validées"
            />
            <StatCard 
                title="Réseau Partenaires" 
                value={String(stats.supplierCount)} 
                icon={Building} 
                colorClass="bg-amber-500/10 text-amber-500"
                subtitle="Fournisseurs actifs"
            />
        </div>
    );
};
