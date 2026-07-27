'use client';

import React, { memo } from 'react';
import type { Sale, Customer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Clock, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import type { HistoryItem } from '@/app/sales-history/page';

interface SalesHistoryTableProps {
    historyItems: HistoryItem[];
    customerMap: Map<string, Customer>;
    selectedItems: Set<string>;
    onToggleSelection: (uuid: string) => void;
    onViewDetails: (sale: Sale) => void;
    onPrint: (sale: Sale) => void;
    onCancel: (sale: Sale) => void;
}

export const SalesHistoryTable = memo(({ 
    historyItems, 
    customerMap, 
    selectedItems,
    onToggleSelection,
    onViewDetails, 
    onPrint, 
    onCancel 
}: SalesHistoryTableProps) => {
    const statusMap = {
        paid: { text: 'كاش', className: 'bg-emerald-500/10 text-emerald-600 border-transparent' },
        partial: { text: 'جزئي', className: 'bg-amber-500/10 text-amber-600 border-transparent' },
        unpaid: { text: 'دين', className: 'bg-red-500/10 text-red-600 border-transparent' },
    };

    const handleToggleAll = (checked: boolean) => {
        if (checked) {
            historyItems.forEach(item => { if (!selectedItems.has(item.data.uuid)) onToggleSelection(item.data.uuid); });
        } else {
            historyItems.forEach(item => { if (selectedItems.has(item.data.uuid)) onToggleSelection(item.data.uuid); });
        }
    };

    const isAllSelected = historyItems.length > 0 && selectedItems.size === historyItems.length;

    return (
        <div className="rounded-xl border bg-card/30 overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none h-7">
                        <TableHead className="w-[30px] px-2 text-center">
                           <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={handleToggleAll}
                                className="h-3 w-3 border-primary/20 data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="px-1 text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest">التوقيت</TableHead>
                        <TableHead className="px-1 text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest">المرجع</TableHead>
                        <TableHead className="px-1 text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest">الشريك</TableHead>
                        <TableHead className="px-1 text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest">الحالة</TableHead>
                        <TableHead className="px-1 text-right text-[7px] font-black uppercase text-primary tracking-widest">القيمة</TableHead>
                        <TableHead className="w-[35px] px-2"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {historyItems.map((item) => {
                        const isSale = item.type === 'sale';
                        const uuid = item.data.uuid;
                        const isSelected = selectedItems.has(uuid);
                        const isCancelled = isSale && item.data.isCancelled;
                        
                        const customer = isSale 
                            ? (item.data.customerUuid ? customerMap.get(item.data.customerUuid) : undefined)
                            : customerMap.get(item.data.customerUuid);

                        const displayName = customer ? `${customer.firstName} ${customer.lastName}` : 'عميل عابر';

                        return (
                            <TableRow 
                                key={uuid} 
                                onClick={() => onToggleSelection(uuid)}
                                className={cn(
                                    "group transition-all border-b border-border/20 cursor-pointer h-7",
                                    isSelected ? "bg-primary/5" : "hover:bg-muted/10",
                                    isCancelled && "opacity-30 grayscale"
                                )}
                            >
                                <TableCell className="px-2 py-0 text-center" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(uuid)}
                                        className="h-3 w-3 border-primary/10"
                                    />
                                </TableCell>
                                <TableCell className="px-1 py-0 whitespace-nowrap">
                                    <span className="font-bold text-[8px] tabular-nums opacity-60">{format(item.date, 'dd/MM HH:mm')}</span>
                                </TableCell>
                                <TableCell className="px-1 py-0">
                                    <span className="text-[8px] font-mono font-bold opacity-20">
                                        {isSale ? item.data.invoiceNumber.slice(-6) : 'PYM-RCV'}
                                    </span>
                                </TableCell>
                                <TableCell className="px-1 py-0">
                                    <span className="font-bold text-[8px] uppercase truncate max-w-[100px] block group-hover:text-primary transition-colors">
                                        {displayName}
                                    </span>
                                </TableCell>
                                <TableCell className="px-1 py-0">
                                    {isCancelled ? (
                                        <span className="text-[6px] font-black uppercase opacity-20">ملغاة</span>
                                    ) : isSale ? (
                                        <Badge variant="outline" className={cn("px-1 py-0 text-[6px] font-black uppercase border-none", statusMap[item.data.paymentStatus].className)}>
                                            {statusMap[item.data.paymentStatus].text}
                                        </Badge>
                                    ) : (
                                        <span className="text-[6px] font-black text-emerald-600 uppercase opacity-30 italic">تحصيل</span>
                                    )}
                                </TableCell>
                                <TableCell className="px-1 py-0 text-right">
                                    <span className={cn(
                                        "font-black text-[9px] tabular-nums tracking-tighter",
                                        isSale ? "text-foreground" : "text-emerald-600"
                                    )}>
                                        {formatCurrency(isSale ? item.data.total : (item.data as any).amount)}
                                    </span>
                                </TableCell>
                                <TableCell className="px-2 py-0 text-right" onClick={(e) => e.stopPropagation()}>
                                    {isSale && !isCancelled && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="h-5 w-5 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity">
                                                    <MoreHorizontal className="h-3 w-3" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-32 rounded-xl border-white/5 bg-card">
                                                <DropdownMenuItem onClick={() => onViewDetails(item.data)} className="text-[9px] font-black p-2 uppercase">فحص</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onPrint(item.data)} className="text-[9px] font-black p-2 uppercase">طباعة</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onCancel(item.data)} className="text-destructive text-[9px] font-black p-2 uppercase">إلغاء</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
});
SalesHistoryTable.displayName = 'SalesHistoryTable';
