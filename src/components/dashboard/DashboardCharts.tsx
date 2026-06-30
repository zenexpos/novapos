'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardChartsProps {
    data: any[];
    isLoading: boolean;
}

/**
 * Command Center Analytics Engine.
 * PRODUCTION AUDIT: Fixed Skeleton import and added memoization.
 */
const DashboardChartsComponent = ({ data, isLoading }: DashboardChartsProps) => {
    if (isLoading) {
        return (
            <Card className="rounded-2xl border-white/5 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden h-[400px]">
                <div className="p-8 space-y-4">
                    <Skeleton className="h-8 w-64 rounded-xl" />
                    <Skeleton className="h-[280px] w-full rounded-2xl" />
                </div>
            </Card>
        );
    }

    const hasData = data && data.length > 0 && data.some(d => d.revenue > 0 || d.profit > 0 || d.expenses > 0);

    return (
        <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-black tracking-tighter uppercase">Dynamique Commerciale</CardTitle>
                        <p className="text-[10px] font-bold uppercase text-primary/50 tracking-widest mt-1">Comparatif CA vs Profit sur la période</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 h-[320px] w-full flex items-center justify-center">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                            <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground) / 0.4)"
                                fontSize={10}
                                fontWeight="900"
                                tickLine={false}
                                axisLine={false}
                                dy={15}
                            />
                            <YAxis 
                                stroke="hsl(var(--muted-foreground) / 0.4)"
                                fontSize={10}
                                fontWeight="900"
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                            />
                            <Tooltip 
                                cursor={{ stroke: 'hsl(var(--primary) / 0.2)', strokeWidth: 2 }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card) / 0.95)',
                                    backdropFilter: 'blur(16px)',
                                    borderColor: 'hsl(var(--border) / 0.5)',
                                    borderRadius: '1.5rem',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                                itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                                formatter={(value: number) => [formatCurrency(value), '']}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '20px' }} />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                name="Chiffre d'Affaires"
                                stroke="hsl(var(--chart-1))" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                                isAnimationActive={false}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="profit" 
                                name="Bénéfice Net"
                                stroke="hsl(var(--chart-2))" 
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                fillOpacity={1} 
                                fill="url(#colorProfit)" 
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center opacity-20 text-center">
                        <BarChart3 className="h-16 w-16 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Aucune donnée pour cette période</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export const DashboardCharts = React.memo(DashboardChartsComponent);
