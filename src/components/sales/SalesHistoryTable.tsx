'use client';

import React from 'react';
import type { Sale, Customer, Payment } from '@/lib/types';
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

export function SalesHistoryTable({ 
    historyItems, 
    customerMap, 
    selectedItems,
    onToggleSelection,
    onViewDetails, 
    onPrint, 
    onCancel 
}: SalesHistoryTableProps) {
    const statusMap = {
        paid: { text: 'Payé', icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        partial: { text: 'Partiel', icon: AlertCircle, className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
        unpaid: { text: 'Dette', icon: Clock, className: 'bg-destructive/10 text-destructive border-destructive/20' },
    };

    const handleSelectAll = () => {
        if (selectedItems.size === historyItems.length) {
            historyItems.forEach(item => {
                const uuid = item.type === 'sale' ? item.data.uuid : item.data.uuid;
                if(selectedItems.has(uuid)) onToggleSelection(uuid);
            });
        } else {
            historyItems.forEach(item => {
                const uuid = item.type === 'sale' ? item.data.uuid : item.data.uuid;
                if(!selectedItems.has(uuid)) onToggleSelection(uuid);
            });
        }
    };

    return (
        <div className="rounded-lg border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="w-[60px] px-6">
                           <Checkbox
                                checked={historyItems.length > 0 && selectedItems.size === historyItems.length}
                                onCheckedChange={handleSelectAll}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Horodatage</TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Type & Ref</TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Partenaire Client</TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Statut / Note</TableHead>
                        <TableHead className="p-6 text-right font-semibold text-[10px] uppercase text-primary">Montant Flux</TableHead>
                        <TableHead className="p-6 w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {historyItems.map((item) => {
                        const isSale = item.type === 'sale';
                        const uuid = isSale ? item.data.uuid : item.data.uuid;
                        const isSelected = selectedItems.has(uuid);
                        const customer = isSale 
                            ? (item.data.customerUuid ? customerMap.get(item.data.customerUuid) : undefined)
                            : customerMap.get(item.data.customerUuid);

                        return (
                            <TableRow 
                                key={uuid} 
                                onClick={() => onToggleSelection(uuid)}
                                className={cn(
                                    "group transition-all border-b border-white/5 cursor-pointer",
                                    isSelected ? "bg-primary/10" : isSale ? "hover:bg-primary/5" : "hover:bg-emerald-500/5"
                                )}
                            >
                                <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(uuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>
                                <TableCell className="p-6 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-black/20 text-muted-foreground/40 shadow-inner">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col -space-y-0.5">
                                            <span className="font-bold text-xs">{format(item.date, 'dd MMM yyyy', { locale: fr })}</span>
                                            <span className="text-[9px] text-muted-foreground/40 uppercase font-semibold tracking-wide">{format(item.date, 'HH:mm')}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-xl shadow-inner",
                                            isSale ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-500"
                                        )}>
                                            {isSale ? <ReceiptIcon className="h-4 w-4" /> : <HandCoins className="h-4 w-4" />}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground/60">
                                            {isSale ? `#${item.data.invoiceNumber}` : 'PAIEMENT'}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/5 text-primary/40">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <span className="font-semibold tracking-tight text-sm group-hover:text-primary transition-colors">
                                            {customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    {isSale ? (
                                        <Badge variant="outline" className={cn("gap-1.5 px-3 py-1 rounded-xl border font-semibold text-[9px] uppercase tracking-tighter shadow-sm", statusMap[item.data.paymentStatus].className)}>
                                            {React.createElement(statusMap[item.data.paymentStatus].icon, { className: "h-3 w-3" })}
                                            {statusMap[item.data.paymentStatus].text}
                                        </Badge>
                                    ) : (
                                        <span className="text-[10px] font-medium text-emerald-600/60 italic truncate max-w-[150px] block">
                                            {item.data.notes || 'Règlement de dette'}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    <span className={cn(
                                        "font-semibold text-base tracking-tighter font-mono",
                                        isSale ? "text-primary" : "text-emerald-500"
                                    )}>
                                        {isSale ? formatCurrency(item.data.total) : formatCurrency(item.data.amount)}
                                    </span>
                                </TableCell>
                                <TableCell className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                                    {isSale && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted group-hover:bg-background/50 transition-all">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-sm bg-card">
                                                <DropdownMenuItem onClick={() => onViewDetails(item.data)} className="rounded-xl p-3">
                                                    <FileText className="mr-2 h-4 w-4" /> Détails Elite
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onPrint(item.data)} className="rounded-xl p-3">
                                                    <Printer className="mr-2 h-4 w-4" /> Imprimer Reçu
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onCancel(item.data)} className="text-destructive focus:text-destructive rounded-xl p-3">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Annuler Vente
                                                </DropdownMenuItem>
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
}
