'use client';

import React, { memo } from 'react';
import type { StockIntake } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Calendar, Hash, Building } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';

interface StockIntakeCardProps {
    intake: StockIntake;
    supplierName?: string;
    onViewDetails: (intake: StockIntake) => void;
    onCancelIntake: (intake: StockIntake) => void;
}

const StockIntakeCardComponent = ({ intake, supplierName, onViewDetails, onCancelIntake }: StockIntakeCardProps) => {
    const name = supplierName || 'Inconnu';

    return (
        <Card 
            onClick={() => onViewDetails(intake)} 
            className="app-card group flex flex-col justify-between transition-all duration-300 bg-card/40 border-white/5 relative overflow-hidden rounded-xl cursor-pointer hover:border-primary/40"
        >
            <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-6 w-6 flex items-center justify-center rounded-md bg-background/50 hover:bg-muted transition-all">
                            <MoreHorizontal className="h-3.5 w-3.5 opacity-40" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-white/5">
                        <DropdownMenuItem onClick={() => onViewDetails(intake)} className="text-xs font-bold p-2"><FileText className="mr-2 h-3.5 w-3.5" /> Détails</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCancelIntake(intake)} className="text-destructive text-xs font-bold p-2"><Trash2 className="mr-2 h-3.5 w-3.5" /> Annuler</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-3 pb-1">
                <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Building className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 pr-6">
                        <CardTitle className="text-[11px] font-black tracking-tight group-hover:text-primary transition-colors truncate uppercase">
                            {name}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[8px] font-mono font-bold text-muted-foreground/30 uppercase tracking-widest">
                            <Hash className="h-2 w-2" /> {intake.invoiceNumber?.slice(-8) || 'REF-ID'}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-3 pt-1">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/50 uppercase">
                    <Calendar className="h-2.5 w-2.5 opacity-30" />
                    {format(safeToDate(intake.createdAt!), 'dd MMM yy', { locale: fr })}
                    <span className="mx-1">•</span>
                    <span>{intake.items.length} ITM</span>
                </div>
            </CardContent>

            <CardFooter className="p-3 pt-2 border-t border-white/5 bg-muted/5 flex items-center justify-between">
                <span className="font-black text-[11px] text-primary tabular-nums tracking-tighter">{formatCurrency(intake.totalValue)}</span>
                <span className="text-[7px] font-black uppercase text-muted-foreground/20 tracking-widest">Audit Confirmed</span>
            </CardFooter>
        </Card>
    );
};

export const StockIntakeCard = memo(StockIntakeCardComponent);
