'use client';

import React, { memo } from 'react';
import type { Sale, Customer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Printer, CheckCircle, AlertCircle, Clock, Hash, User, HandCoins, Receipt as ReceiptIcon } from 'lucide-react';
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
        paid: { text: 'كاش', className: 'bg-emerald-500/5 text-emerald-600 border-transparent' },
        partial: { text: 'جزئي', className: 'bg-amber-500/5 text-amber-600 border-transparent' },
        unpaid: { text: 'دين', className: 'bg-red-500/5 text-red-600 border-transparent' },
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
        <div className="rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none h-8">
                        <TableHead className="w-[30px] px-2">
                           <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={handleToggleAll}
                                className="h-3 w-3 border-primary/20 data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="px-1 text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">الوقت</TableHead>
                        <TableHead className="px-1 text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">المرجع</TableHead>
                        <TableHead className="px-1 text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">الشريك</TableHead>
                        <TableHead className="px-1 text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">الحالة</TableHead>
                        <TableHead className="px-1 text-right text-[8px] font-black uppercase text-primary tracking-widest">القيمة</TableHead>
                        <TableHead className="w-[40px] px-2"></TableHead>
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
                                    "group transition-all border-b border-white/5 cursor-pointer h-8",
                                    isSelected ? "bg-primary/5" : "hover:bg-primary/5",
                                    isCancelled && "opacity-30 grayscale"
                                )}
                            >
                                <TableCell className="px-2 py-0" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(uuid)}
                                        className="h-3 w-3 border-primary/10"
                                    />
                                </TableCell>
                                <TableCell className="px-1 py-0 whitespace-nowrap">
                                    <span className="font-bold text-[9px] tabular-nums">{format(item.date, 'dd/MM HH:mm')}</span>
                                </TableCell>
                                <TableCell className="px-1 py-0">
                                    <span className="text-[8px] font-mono font-bold opacity-30 tracking-tighter">
                                        {isSale ? item.data.invoiceNumber.slice(-6) : 'PYM-RCV'}
                                    </span>
                                </TableCell>
                                <TableCell className="px-1 py-0">
                                    <span className="font-bold text-[9px] uppercase truncate max-w-[120px] block transition-colors group-hover:text-primary">
                                        {displayName}
                                    </span>
                                </TableCell>
                                <TableCell className="px-1 py-0">
                                    {isCancelled ? (
                                        <span className="text-[7px] font-black uppercase opacity-20">ملغاة</span>
                                    ) : isSale ? (
                                        <Badge variant="outline" className={cn("px-1 py-0 text-[6px] font-black uppercase border-none", statusMap[item.data.paymentStatus].className)}>
                                            {statusMap[item.data.paymentStatus].text}
                                        </Badge>
                                    ) : (
                                        <span className="text-[7px] font-black text-emerald-600 uppercase opacity-40 italic">تحصيل</span>
                                    )}
                                </TableCell>
                                <TableCell className="px-1 py-0 text-right">
                                    <span className={cn(
                                        "font-black text-[10px] tabular-nums tracking-tighter",
                                        isSale ? "text-foreground" : "text-emerald-600"
                                    )}>
                                        {isSale ? formatCurrency(item.data.total) : formatCurrency((item.data as any).amount)}
                                    </span>
                                </TableCell>
                                <TableCell className="px-2 py-0 text-right" onClick={(e) => e.stopPropagation()}>
                                    {isSale && !isCancelled && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
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
