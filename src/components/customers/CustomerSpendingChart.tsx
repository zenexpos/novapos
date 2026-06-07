'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface CustomerSpendingChartProps {
    data: { month: string, total: number }[];
}

export function CustomerSpendingChart({ data }: CustomerSpendingChartProps) {
    return (
        <Card className="app-card bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden rounded-lg">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold tracking-tighter">Courbe de Fidélité</CardTitle>
                        <CardDescription className="text-[10px] font-semibold uppercase text-emerald-500/50">Analyse des flux financiers (6 mois)</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                        <XAxis 
                            dataKey="month" 
                            stroke="hsl(var(--muted-foreground) / 0.4)"
                            fontSize={10}
                            fontWeight="900"
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis 
                            stroke="hsl(var(--muted-foreground) / 0.4)"
                            fontSize={10}
                            fontWeight="900"
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
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
                            formatter={(value: number) => [formatCurrency(value), 'Dépenses']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="total" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorSpending)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
