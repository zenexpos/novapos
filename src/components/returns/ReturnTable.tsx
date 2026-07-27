'use client';

import React from 'react';
import type { ProductReturn, Customer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Hash, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

interface ReturnTableProps {
    returns: ProductReturn[];
    customerMap: Map<string, Customer>;
    selectedReturns: Set<string>;
    onToggleSelection: (uuid: string) => void;
    onViewDetails: (pr: ProductReturn) => void;
    onCancel: (pr: ProductReturn) => void;
}

export function ReturnTable({ returns, customerMap, selectedReturns, onToggleSelection, onViewDetails, onCancel }: ReturnTableProps) {
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            returns.forEach(r => { if(!selectedReturns.has(r.uuid)) onToggleSelection(r.uuid) });
        } else {
            returns.forEach(r => { if(selectedReturns.has(r.uuid)) onToggleSelection(r.uuid) });
        }
    };

    return (
        <div className="rounded-xl border bg-card/30 overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none h-7">
                        <TableHead className="w-[30px] px-2 text-center">
                           <Checkbox
                                checked={returns.length > 0 && selectedReturns.size === returns.length}
                                onCheckedChange={handleSelectAll}
                                className="h-3 w-3 border-primary/20 data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="px-1 text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest">التوقيت</TableHead>
                        <TableHead className="px-1 text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest">الأصل</TableHead>
                        <TableHead className="px-1 text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest">الشريك</TableHead>
                        <TableHead className="px-1 text-right text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest">مردود</TableHead>
                        <TableHead className="px-1 text-right text-[7px] font-black uppercase text-primary tracking-widest">القيمة</TableHead>
                        <TableHead className="w-[35px] px-2"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {returns.map((r) => {
                        const customer = r.customerUuid ? customerMap.get(r.customerUuid) : undefined;
                        const isSelected = selectedReturns.has(r.uuid);

                        return (
                            <TableRow 
                                key={r.uuid} 
                                onClick={() => onToggleSelection(r.uuid)}
                                className={cn(
                                    "group transition-all border-b border-border/20 cursor-pointer h-7",
                                    isSelected ? "bg-primary/5" : "hover:bg-muted/10"
                                )}
                            >
                                <TableCell className="px-2 py-0 text-center" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(r.uuid)}
                                        className="h-3 w-3 border-primary/10"
                                    />
                                </TableCell>
                                <TableCell className="px-1 py-0 whitespace-nowrap">
                                    <span className="font-bold text-[8px] tabular-nums opacity-60">{format(safeToDate(r.createdAt!), 'dd/MM HH:mm')}</span>
                                </TableCell>
                                <TableCell className="px-1 py-0">
                                    <span className="text-[8px] font-mono font-bold opacity-30">#{r.originalInvoiceNumber.slice(-6)}</span>
                                </TableCell>
                                <TableCell className="px-1 py-0">
                                    <span className="font-bold text-[8px] uppercase truncate max-w-[150px] block group-hover:text-primary transition-colors">
                                        {customer ? `${customer.firstName} ${customer.lastName}` : 'عابر'}
                                    </span>
                                </TableCell>
                                <TableCell className="px-1 py-0 text-right font-mono text-[8px] text-emerald-500 font-bold">
                                    {formatCurrency(r.amountRefunded)}
                                </TableCell>
                                <TableCell className="px-1 py-0 text-right">
                                    <span className="font-black text-[9px] tabular-nums tracking-tighter text-foreground">
                                        {formatCurrency(r.totalReturnValue)}
                                    </span>
                                </TableCell>
                                <TableCell className="px-2 py-0 text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-5 w-5 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity">
                                                <MoreHorizontal className="h-3 w-3" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32 rounded-xl border-white/5 bg-card">
                                            <DropdownMenuItem onClick={() => onViewDetails(r)} className="text-[9px] font-black p-2 uppercase">فحص</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onCancel(r)} className="text-destructive text-[9px] font-black p-2 uppercase">إلغاء</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
