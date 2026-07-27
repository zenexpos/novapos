'use client';

import React from 'react';
import type { ProductReturn } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Clock, Hash, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

interface ReturnHistoryCardProps {
    productReturn: ProductReturn;
    customerName?: string;
    isSelected: boolean;
    onToggleSelection: () => void;
    onViewDetails: (pr: ProductReturn) => void;
    onCancelReturn: (pr: ProductReturn) => void;
}

const ReturnHistoryCardComponent = ({ 
    productReturn, 
    customerName, 
    isSelected,
    onToggleSelection,
    onViewDetails, 
    onCancelReturn 
}: ReturnHistoryCardProps) => {

    return (
        <Card 
            onClick={onToggleSelection}
            className={cn(
                "group relative flex flex-col transition-all duration-200 bg-card/40 border border-border/20 rounded-lg cursor-pointer",
                isSelected ? "border-primary bg-primary/5" : "hover:border-primary/20 shadow-none"
            )}
        >
            <div className="absolute top-1.5 right-1.5 z-10 flex gap-0.5 items-center" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggleSelection}
                    className="h-3 w-3 border-primary/20"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-5 w-5 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity">
                            <MoreHorizontal className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32 rounded-xl border-white/5 bg-card">
                        <DropdownMenuItem onClick={() => onViewDetails(productReturn)} className="text-[9px] font-black p-2 uppercase">
                            <FileText className="mr-2 h-3 w-3" /> Détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCancelReturn(productReturn)} className="text-destructive text-[9px] font-black p-2 uppercase">
                            <Trash2 className="mr-2 h-3 w-3" /> Annuler retour
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-2 pb-0.5 space-y-0.5">
                <div className="flex items-center gap-1">
                    <span className="text-[6px] font-mono font-bold text-muted-foreground/30 uppercase tracking-tighter">
                        <Hash className="h-1.5 w-1.5" /> {productReturn.originalInvoiceNumber.slice(-8)}
                    </span>
                </div>
                <CardTitle className="text-[10px] font-black leading-none tracking-tight group-hover:text-primary transition-colors truncate pr-6 uppercase">
                    {customerName || 'Client de passage'}
                </CardTitle>
                <div className="flex items-center gap-1 text-[6px] text-muted-foreground/30 font-bold uppercase tracking-widest">
                    <Clock className="h-1.5 w-1.5 opacity-30" />
                    {format(safeToDate(productReturn.createdAt!), 'd MMM, HH:mm', { locale: fr })}
                </div>
            </CardHeader>

            <CardContent className="p-2 py-1">
                <div className="flex justify-between items-center bg-black/5 rounded-md p-1.5">
                    <div className="flex flex-col">
                        <span className="text-[6px] font-bold uppercase text-muted-foreground/40">Remboursé</span>
                        <span className="font-black text-[10px] tabular-nums text-emerald-600 leading-none">{formatCurrency(productReturn.amountRefunded)}</span>
                    </div>
                    <div className="text-right flex flex-col border-l border-white/5 pl-1.5">
                        <span className="text-[6px] font-bold uppercase text-muted-foreground/40">Valeur</span>
                        <span className="font-black text-[10px] tabular-nums text-foreground leading-none">{formatCurrency(productReturn.totalReturnValue)}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-1.5 pt-0 flex justify-end">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(productReturn); }} className="h-4 rounded-md font-black text-[7px] uppercase tracking-widest hover:bg-primary/5 hover:text-primary px-1">
                    Examiner <ChevronRight className="ml-0.5 h-1.5 w-1.5" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export const ReturnHistoryCard = React.memo(ReturnHistoryCardComponent);
