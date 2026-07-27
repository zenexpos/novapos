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
        paid: { text: 'خالصة كاش', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        partial: { text: 'دفع جزئي', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
        unpaid: { text: 'دين كلي', icon: Clock, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
    };
    const status = paymentStatusMap[sale.paymentStatus];

    return (
        <Card 
            onClick={onToggleSelection}
            className={cn(
                "group relative flex flex-col transition-all duration-300 bg-card/40 border border-white/5 rounded-xl cursor-pointer",
                isSelected ? "ring-2 ring-primary bg-primary/5 shadow-lg scale-[1.02]" : "hover:border-primary/40 hover:bg-card shadow-sm",
                isCancelled && "opacity-40 grayscale"
            )}
        >
            <div 
                className="absolute top-3 right-3 z-10 flex gap-1.5 items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-1.5 bg-background/80 backdrop-blur-md rounded-lg border border-white/5 shadow-sm">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-4 w-4 border-primary/40 data-[state=checked]:bg-primary"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-7 w-7 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-md border border-white/5 opacity-40 group-hover:opacity-100 hover:bg-muted transition-all">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-white/5 shadow-xl bg-card">
                        <DropdownMenuItem onClick={() => onViewDetails(sale)} className="text-xs font-bold p-2.5">
                            <FileText className="mr-2 h-3.5 w-3.5 opacity-40" /> التفاصيل المالية
                        </DropdownMenuItem>
                        {!isCancelled && (
                            <DropdownMenuItem onClick={() => onCancelSale(sale)} className="text-destructive text-xs font-bold p-2.5">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> إلغاء الفاتورة
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-4 pb-1 space-y-2">
                <div className="flex items-center gap-2">
                    {isCancelled ? (
                        <Badge variant="outline" className="rounded-md font-black uppercase text-[7px] px-1.5 py-0 border border-muted opacity-60">ملغاة</Badge>
                    ) : (
                        <Badge variant="outline" className={cn("rounded-md font-black uppercase text-[7px] px-1.5 py-0 border tracking-tighter", status.bg, status.color)}>
                            <status.icon className="h-2 w-2 mr-1" />
                            {status.text}
                        </Badge>
                    )}
                    <span className="text-[8px] font-mono font-bold text-muted-foreground/30 flex items-center gap-1 uppercase">
                        <Hash className="h-2 w-2" /> {sale.invoiceNumber.slice(-8)}
                    </span>
                </div>
                <CardTitle className="text-base font-black leading-tight tracking-tight group-hover:text-primary transition-colors truncate pr-14 uppercase">
                    {customerName || 'عميل عابر'}
                </CardTitle>
                <div className="flex items-center gap-2 text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                    <Clock className="h-2.5 w-2.5" />
                    {format(safeToDate(sale.createdAt!), 'd MMM, HH:mm', { locale: fr })}
                </div>
            </CardHeader>

            <CardContent className="p-4 py-3 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5 shadow-inner">
                        <p className="text-[7px] font-black uppercase text-muted-foreground/40 mb-1">حجم السلع</p>
                        <p className="font-black text-xs tabular-nums">{sale.items?.length || 0} صنف</p>
                    </div>
                    {!isCancelled && (
                        <div className={cn(
                            "p-3 rounded-xl border shadow-inner",
                            sale.remainingBalance > 0.01 ? "bg-red-500/5 border-red-500/10" : "bg-emerald-500/5 border-emerald-500/10"
                        )}>
                            <p className={cn("text-[7px] font-black uppercase mb-1", sale.remainingBalance > 0.01 ? "text-red-500/60" : "text-emerald-600/60")}>
                                {sale.remainingBalance > 0.01 ? 'الدين المتبقي' : 'الرصيد خالص'}
                            </p>
                            <p className={cn("font-black text-xs tabular-nums tracking-tighter", sale.remainingBalance > 0.01 ? "text-red-500" : "text-emerald-500")}>
                                {formatCurrency(Math.max(0, sale.remainingBalance))}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-3 border-t border-white/5 bg-muted/5 flex items-center justify-between">
                 <div className="space-y-0">
                    <p className="text-[7px] font-black uppercase text-muted-foreground/30 tracking-widest">إجمالي الفاتورة</p>
                    <p className="text-lg font-black text-primary tracking-tighter tabular-nums leading-none">{formatCurrency(sale.total)}</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onViewDetails(sale); }} 
                    className="h-8 rounded-lg font-black text-[8px] uppercase tracking-[0.2em] hover:bg-primary/10 hover:text-primary px-3"
                >
                    فحص <ChevronRight className="ml-1 h-2.5 w-2.5" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export const SalesHistoryCard = memo(SalesHistoryCardComponent);
