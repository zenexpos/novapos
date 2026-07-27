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
        paid: { text: 'مسددة', icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
        partial: { text: 'جزئية', icon: AlertCircle, className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
        unpaid: { text: 'دين', icon: Clock, className: 'bg-red-500/10 text-red-600 border-red-500/20' },
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
        <div className="rounded-2xl border bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none h-9">
                        <TableHead className="w-[40px] px-3">
                           <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={handleToggleAll}
                                className="border-primary/40 data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="px-2 font-black text-[9px] uppercase text-muted-foreground/60 tracking-widest">الوقت</TableHead>
                        <TableHead className="px-2 font-black text-[9px] uppercase text-muted-foreground/60 tracking-widest">المرجع</TableHead>
                        <TableHead className="px-2 font-black text-[9px] uppercase text-muted-foreground/60 tracking-widest">العميل الشريك</TableHead>
                        <TableHead className="px-2 font-black text-[9px] uppercase text-muted-foreground/60 tracking-widest">حالة التدفق</TableHead>
                        <TableHead className="px-2 text-right font-black text-[9px] uppercase text-primary tracking-widest">القيمة</TableHead>
                        <TableHead className="w-[60px] px-4"></TableHead>
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
                                    "group transition-all border-b border-white/5 cursor-pointer h-10",
                                    isSelected ? "bg-primary/5" : isSale ? "hover:bg-primary/5" : "hover:bg-emerald-500/5",
                                    isCancelled && "opacity-40 grayscale"
                                )}
                            >
                                <TableCell className="px-3 py-0" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(uuid)}
                                        className="border-primary/40"
                                    />
                                </TableCell>
                                <TableCell className="px-2 py-0 whitespace-nowrap">
                                    <div className="flex flex-col -space-y-1">
                                        <span className="font-bold text-[10px]">{format(item.date, 'dd MMM', { locale: fr })}</span>
                                        <span className="text-[8px] text-muted-foreground/40 uppercase">{format(item.date, 'HH:mm')}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-2 py-0">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "p-1.5 rounded-lg shadow-inner",
                                            isSale ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-500"
                                        )}>
                                            {isSale ? <ReceiptIcon className="h-3 w-3" /> : <HandCoins className="h-3 w-3" />}
                                        </div>
                                        <span className="text-[9px] font-mono font-bold text-muted-foreground/50 tracking-tighter">
                                            {isSale ? item.data.invoiceNumber.slice(-8) : 'CASH-RCV'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-2 py-0">
                                    <span className="font-bold tracking-tight text-[10px] uppercase truncate max-w-[150px] block group-hover:text-primary transition-colors">
                                        {displayName}
                                    </span>
                                </TableCell>
                                <TableCell className="px-2 py-0">
                                    {isCancelled ? (
                                        <Badge variant="outline" className="px-1.5 py-0 rounded-md font-black text-[7px] uppercase tracking-tighter border-muted">ملغاة</Badge>
                                    ) : isSale ? (
                                        <Badge variant="outline" className={cn("gap-1 px-1.5 py-0 rounded-md font-black text-[7px] uppercase tracking-tighter shadow-sm", statusMap[item.data.paymentStatus].className)}>
                                            {React.createElement(statusMap[item.data.paymentStatus].icon, { className: "h-2 w-2" })}
                                            {statusMap[item.data.paymentStatus].text}
                                        </Badge>
                                    ) : (
                                        <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase italic opacity-60">
                                            <CheckCircle className="h-2 w-2" /> تحصيل دين
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="px-2 py-0 text-right">
                                    <span className={cn(
                                        "font-black text-[11px] tabular-nums tracking-tighter",
                                        isSale ? "text-foreground/80" : "text-emerald-600"
                                    )}>
                                        {isSale ? formatCurrency(item.data.total) : formatCurrency((item.data as any).amount)}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-0 text-right" onClick={(e) => e.stopPropagation()}>
                                    {isSale && !isCancelled && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="h-7 w-7 flex items-center justify-center rounded-md opacity-20 group-hover:opacity-100 hover:bg-muted transition-all">
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-white/5">
                                                <DropdownMenuItem onClick={() => onViewDetails(item.data)} className="text-xs font-bold p-2"><FileText className="mr-2 h-3.5 w-3.5" /> فحص التفاصيل</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onPrint(item.data)} className="text-xs font-bold p-2"><Printer className="mr-2 h-3.5 w-3.5" /> طباعة الفاتورة</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onCancel(item.data)} className="text-destructive text-xs font-bold p-2"><Trash2 className="mr-2 h-3.5 w-3.5" /> إلغاء البيع</DropdownMenuItem>
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
