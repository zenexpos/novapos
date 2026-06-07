'use client';

import React from 'react';
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, CheckCircle, AlertCircle, Clock, Hash, Receipt, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';

interface SalesHistoryCardProps {
    sale: Sale;
    customerName?: string;
    isSelected: boolean;
    onToggleSelection: () => void;
    onViewDetails: (sale: Sale) => void;
    onCancelSale: (sale: Sale) => void;
}

const SalesHistoryCardComponent = ({ 
    sale, 
    customerName, 
    isSelected,
    onToggleSelection,
    onViewDetails, 
    onCancelSale 
}: SalesHistoryCardProps) => {
    const paymentStatusMap = {
        paid: { text: 'Payé Cash', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        partial: { text: 'Solde Partiel', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
        unpaid: { text: 'Dette Totale', icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
    };
    const status = paymentStatusMap[sale.paymentStatus];

    const handleCardClick = () => {
        onToggleSelection();
    };

    return (
        <Card 
            onClick={handleCardClick}
            className={cn(
                "app-card group flex flex-col transition-all duration-500 bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden rounded-lg cursor-pointer",
                isSelected ? "ring-2 ring-primary border-primary/30 shadow-sm scale-[1.02]" : "hover:bg-primary/5"
            )}
        >
            <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                <Receipt className="h-32 w-32 rotate-12" />
            </div>

            {/* Actions isolated container */}
            <div 
                className="absolute top-4 right-4 z-10 flex gap-2 items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-1.5 bg-background/80 backdrop-blur-md rounded-xl border border-white/5 shadow-sm flex items-center justify-center">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-9 w-9 bg-background/80 backdrop-blur-md border-white/5 shadow-xl rounded-xl transition-transform active:scale-95">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-sm bg-card">
                        <DropdownMenuItem onClick={() => onViewDetails(sale)} className="rounded-xl p-3">
                            <FileText className="mr-2 h-4 w-4" /> Examiner détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCancelSale(sale)} className="text-destructive focus:text-destructive rounded-xl p-3">
                            <Trash2 className="mr-2 h-4 w-4" /> Annuler la vente
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-6 pb-2 space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("rounded-lg font-semibold uppercase text-[8px] px-2 py-0.5 border shadow-sm", status.bg, status.color)}>
                        <status.icon className="h-2.5 w-2.5 mr-1" />
                        {status.text}
                    </Badge>
                    <span className="text-[10px] font-mono font-semibold text-muted-foreground/30 flex items-center gap-1 uppercase tracking-tighter">
                        <Hash className="h-2.5 w-2.5" /> {sale.invoiceNumber}
                    </span>
                </div>
                <CardTitle className="text-xl font-semibold leading-tight tracking-tighter group-hover:text-primary transition-colors truncate pr-12">
                    {customerName || 'Client de passage'}
                </CardTitle>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40 font-semibold uppercase tracking-wide">
                    <Clock className="h-3 w-3 opacity-50" />
                    {format(safeToDate(sale.createdAt!), 'd MMMM, HH:mm', { locale: fr })}
                </div>
            </CardHeader>

            <CardContent className="p-6 py-4 space-y-5 relative z-10">
                <div className="flex items-center justify-between text-[9px] font-semibold uppercase text-muted-foreground/60 border-b border-white/5 pb-2">
                    <span className="text-foreground">Recu: {formatCurrency(sale.amountPaid)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-black/20 border border-white/5 shadow-inner">
                        <p className="text-[8px] font-semibold uppercase text-muted-foreground/40 mb-1.5">Volume Items</p>
                        <p className="font-semibold text-sm tracking-tight">{sale.items?.length || 0} Positions</p>
                    </div>
                    <div className={cn(
                        "p-4 rounded-3xl border transition-all duration-500 shadow-inner",
                        sale.remainingBalance > 0 ? "bg-destructive/5 border-destructive/20" : "bg-emerald-500/5 border-emerald-500/20"
                    )}>
                        <p className={cn("text-[8px] font-semibold uppercase mb-1.5", sale.remainingBalance > 0 ? "text-destructive/70" : "text-emerald-600/70")}>
                            {sale.remainingBalance > 0 ? 'Reste à Payé' : 'Vente Solder'}
                        </p>
                        <p className={cn("font-semibold text-sm tracking-tight", sale.remainingBalance > 0 ? "text-destructive" : "text-emerald-500")}>
                            {formatCurrency(Math.max(0, sale.remainingBalance))}
                        </p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-4 border-t border-white/5 bg-muted/5 flex items-center justify-between relative z-10">
                 <div className="space-y-0.5">
                    <p className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wide">Valeur Transaction</p>
                    <p className="text-lg font-semibold text-primary tracking-tighter leading-none">{formatCurrency(sale.total)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(sale); }} className="h-9 rounded-xl font-semibold text-[10px] uppercase tracking-wide hover:bg-primary/10 hover:text-primary transition-all px-4">
                    Details <ChevronRight className="ml-1 h-3 w-3 opacity-50" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export const SalesHistoryCard = React.memo(SalesHistoryCardComponent);
