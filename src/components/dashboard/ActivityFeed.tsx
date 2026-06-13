'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    Activity, Clock, ShoppingCart, User, 
    Landmark, Wallet, Archive, History, ChevronRight
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityFeedProps {
    items: any[];
    isLoading: boolean;
}

const iconMap: any = {
    sale: ShoppingCart,
    payment: Landmark,
    return: History,
    product: Archive,
    customer: User,
    expense: Wallet,
    intake: Archive
};

export function ActivityFeed({ items, isLoading }: ActivityFeedProps) {
    if (isLoading) return null;

    return (
        <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Journal d'Activité Elite</CardTitle>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-20">Temps Réel</span>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                    {items.length === 0 ? (
                        <div className="py-20 text-center opacity-20">
                            <Clock className="h-10 w-10 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Aucun flux récent</p>
                        </div>
                    ) : (
                        items.map((item) => {
                            const Icon = iconMap[item.type] || Activity;
                            return (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                    <div className="flex items-center gap-5 min-w-0">
                                        <div className={cn(
                                            "h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110",
                                            item.status === 'success' ? "bg-emerald-500/10 text-emerald-500" : 
                                            item.status === 'warning' ? "bg-amber-500/10 text-amber-500" : 
                                            "bg-primary/10 text-primary"
                                        )}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold tracking-tight">{item.title}</p>
                                            <p className="text-[10px] text-muted-foreground/50 uppercase font-semibold tracking-wide flex items-center gap-2">
                                                {item.description}
                                                <span className="h-1 w-1 rounded-full bg-white/10" />
                                                {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        {item.amount && (
                                            <div className="text-right">
                                                <p className={cn(
                                                    "text-sm font-black tabular-nums tracking-tighter",
                                                    item.type === 'sale' ? "text-primary" : 
                                                    item.type === 'payment' ? "text-emerald-500" : 
                                                    item.type === 'return' ? "text-amber-500" : "text-foreground"
                                                )}>
                                                    {item.type === 'return' ? '-' : ''}{formatCurrency(item.amount)}
                                                </p>
                                            </div>
                                        )}
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/10 group-hover:text-primary/40 transition-colors" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
            <div className="p-4 bg-muted/5 border-t border-white/5 flex justify-center">
                <button className="text-[9px] font-black uppercase text-muted-foreground/30 hover:text-primary tracking-[0.3em] transition-colors">
                    Archives Systèmes Complètes
                </button>
            </div>
        </Card>
    );
}
