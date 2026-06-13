'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    Package, Users, ArrowUpRight, TrendingUp, 
    Star, ShoppingBag, Landmark, History
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface TopListsProps {
    type: 'products' | 'customers';
    items: any[];
    isLoading: boolean;
}

export function TopLists({ type, items, isLoading }: TopListsProps) {
    if (isLoading) return <Skeleton className="h-[400px] w-full rounded-2xl bg-card/40" />;

    const isProducts = type === 'products';
    const Icon = isProducts ? Package : Users;
    const title = isProducts ? 'Top 10 Produits (CA)' : 'Top 10 Clients Elite';

    return (
        <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
                <CardTitle className="text-xs font-black uppercase text-muted-foreground/60 flex items-center justify-between tracking-widest">
                    <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-primary" /> {title}
                    </div>
                    {isProducts && <TrendingUp className="h-3 w-3 opacity-20" />}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                    {items.length === 0 ? (
                        <div className="py-20 text-center opacity-20">
                            <p className="text-[10px] font-black uppercase">Aucune donnée disponible</p>
                        </div>
                    ) : (
                        items.map((item, idx) => (
                            <div key={idx} className="group p-4 flex items-center justify-between hover:bg-primary/5 transition-all">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-8 w-8 rounded-xl bg-black/40 flex items-center justify-center text-[10px] font-black text-primary border border-white/5 shadow-inner">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold tracking-tight truncate group-hover:text-primary transition-colors">
                                            {item.name}
                                        </p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            {isProducts ? (
                                                <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase">
                                                    {item.quantitySold} vendus · {formatCurrency(item.revenueGenerated)}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase">
                                                    {formatCurrency(item.totalSpent)} total dépensé
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-right shrink-0">
                                    {isProducts ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-black text-emerald-500 tabular-nums">+{item.marginPercent.toFixed(0)}%</span>
                                            <div className="h-1 w-12 bg-emerald-500/10 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${item.marginPercent}%` }} />
                                            </div>
                                        </div>
                                    ) : (
                                        item.outstandingBalance > 1 ? (
                                            <div className="px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500 text-[8px] font-black uppercase border border-red-500/20">
                                                Dette Active
                                            </div>
                                        ) : (
                                            <Star className="h-3.5 w-3.5 text-primary opacity-20" />
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
            {items.length > 0 && (
                <div className="p-4 bg-muted/5 border-t border-white/5 text-center">
                    <Link href={isProducts ? "/products" : "/customers"} className="text-[8px] font-black uppercase text-primary/40 hover:text-primary tracking-[0.2em] transition-colors">
                        Consulter Registre Complet
                    </Link>
                </div>
            )}
        </Card>
    );
}
