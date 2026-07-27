'use client';

import React, { memo } from 'react';
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, CheckCircle, AlertCircle, Clock, Hash, ChevronRight } from 'lucide-react';
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
    const isCancelled = sale.isCancelled;
    
    const paymentStatusMap = {
        paid: { text: 'خالصة', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
        partial: { text: 'جزئية', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5' },
        unpaid: { text: 'دين', icon: Clock, color: 'text-red-500', bg: 'bg-red-500/5' },
    };
    const status = paymentStatusMap[sale.paymentStatus];

    return (
        <Card 
            onClick={onToggleSelection}
            className={cn(
                "group relative flex flex-col transition-all duration-300 bg-card/40 border border-white/5 rounded-xl cursor-pointer",
                isSelected ? "ring-1 ring-primary bg-primary/5" : "hover:border-primary/20",
                isCancelled && "opacity-40 grayscale"
            )}
        >
            <div className="absolute top-2.5 right-2.5 z-10 flex gap-1.5 items-center" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggleSelection}
                    className="h-3.5 w-3.5 border-primary/20"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-6 w-6 flex items-center justify-center rounded-md opacity-20 group-hover:opacity-100 hover:bg-muted transition-all">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-white/5 shadow-xl bg-card">
                        <DropdownMenuItem onClick={() => onViewDetails(sale)} className="text-[10px] font-black p-2 uppercase">التفاصيل</DropdownMenuItem>
                        {!isCancelled && (
                            <DropdownMenuItem onClick={() => onCancelSale(sale)} className="text-destructive text-[10px] font-black p-2 uppercase">إلغاء</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-3 pb-1 space-y-1">
                <div className="flex items-center gap-1.5">
                    {isCancelled ? (
                        <Badge variant="outline" className="text-[6px] font-black uppercase px-1 py-0 opacity-40">ملغاة</Badge>
                    ) : (
                        <Badge variant="outline" className={cn("text-[6px] font-black uppercase px-1 py-0 border-none", status.bg, status.color)}>
                            {status.text}
                        </Badge>
                    )}
                    <span className="text-[7px] font-mono font-bold text-muted-foreground/30 uppercase tracking-tighter">
                        #{sale.invoiceNumber.slice(-6)}
                    </span>
                </div>
                <CardTitle className="text-xs font-black leading-tight tracking-tight group-hover:text-primary transition-colors truncate pr-10 uppercase">
                    {customerName || 'عميل عابر'}
                </CardTitle>
            </CardHeader>

            <CardContent className="p-3 py-2 space-y-3">
                <div className="flex justify-between items-center bg-black/10 rounded-lg p-2 border border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[6px] font-black uppercase text-muted-foreground/40">المبلغ الإجمالي</span>
                        <span className="font-black text-xs tabular-nums text-primary">{formatCurrency(sale.total)}</span>
                    </div>
                    {!isCancelled && sale.remainingBalance > 0.01 && (
                         <div className="text-right flex flex-col">
                            <span className="text-[6px] font-black uppercase text-red-500/40">الباقي</span>
                            <span className="font-black text-xs tabular-nums text-red-500">{formatCurrency(sale.remainingBalance)}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-[7px] text-muted-foreground/30 font-bold uppercase tracking-widest">
                    <Clock className="h-2 w-2 opacity-30" />
                    {format(safeToDate(sale.createdAt!), 'd MMM, HH:mm', { locale: fr })}
                </div>
            </CardContent>

            <CardFooter className="p-2 pt-0 flex justify-end">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onViewDetails(sale); }} 
                    className="h-6 rounded-md font-black text-[7px] uppercase tracking-widest hover:bg-primary/5 hover:text-primary px-2"
                >
                    فحص <ChevronRight className="ml-1 h-2 w-2" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export const SalesHistoryCard = memo(SalesHistoryCardComponent);
