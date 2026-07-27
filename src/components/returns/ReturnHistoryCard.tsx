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
                "group relative flex flex-col transition-all duration-200 bg-card/40 border border-border/40 rounded-xl cursor-pointer",
                isSelected ? "border-primary bg-primary/5" : "hover:border-primary/20"
            )}
        >
            <div className="absolute top-2 right-2 z-10 flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggleSelection}
                    className="h-3 w-3 border-primary/20"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity">
                            <MoreHorizontal className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl border-white/5 bg-card">
                        <DropdownMenuItem onClick={() => onViewDetails(productReturn)} className="text-[9px] font-black p-2 uppercase">
                            <FileText className="mr-2 h-3 w-3" /> التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCancelReturn(productReturn)} className="text-destructive text-[9px] font-black p-2 uppercase">
                            <Trash2 className="mr-2 h-3 w-3" /> إلغاء العملية
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-3 pb-1 space-y-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-[7px] font-mono font-bold text-muted-foreground/30 uppercase tracking-tighter">
                        <Hash className="h-2 w-2" /> {productReturn.originalInvoiceNumber}
                    </span>
                </div>
                <CardTitle className="text-[11px] font-black leading-tight tracking-tight group-hover:text-primary transition-colors truncate pr-8 uppercase">
                    {customerName || 'زبون عابر'}
                </CardTitle>
                <div className="flex items-center gap-1 text-[6px] text-muted-foreground/30 font-bold uppercase tracking-widest">
                    <Clock className="h-1.5 w-1.5 opacity-30" />
                    {format(safeToDate(productReturn.createdAt!), 'd MMMM, HH:mm', { locale: fr })}
                </div>
            </CardHeader>

            <CardContent className="p-3 py-1.5">
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-black/10 border border-white/5">
                        <p className="text-[6px] font-bold uppercase text-muted-foreground/40 mb-1">السلع</p>
                        <p className="font-black text-[9px] tracking-tight">{productReturn.items.length} صنف</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-[6px] font-bold uppercase text-emerald-600/70 mb-1">المبلغ المردود</p>
                        <p className="font-black text-[9px] tracking-tight text-emerald-600">{formatCurrency(productReturn.amountRefunded)}</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-2 pt-0 border-t border-white/5 bg-muted/5 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[6px] font-black uppercase text-muted-foreground/30">القيمة الإجمالية</span>
                    <span className="text-sm font-black text-primary tabular-nums tracking-tighter leading-none">{formatCurrency(productReturn.totalReturnValue)}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(productReturn); }} className="h-5 rounded-md font-black text-[7px] uppercase tracking-widest hover:bg-primary/5 hover:text-primary px-1.5">
                    فحص <ChevronRight className="ml-0.5 h-2 w-2" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export const ReturnHistoryCard = React.memo(ReturnHistoryCardComponent);
