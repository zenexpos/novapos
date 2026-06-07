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
    const handleSelectAll = () => {
        const allUuids = returns.map(r => r.uuid);
        if (selectedReturns.size === returns.length) {
            allUuids.forEach(uuid => { if(selectedReturns.has(uuid)) onToggleSelection(uuid) });
        } else {
            allUuids.forEach(uuid => { if(!selectedReturns.has(uuid)) onToggleSelection(uuid) });
        }
    };

    return (
        <div className="rounded-lg border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="w-[60px] px-6">
                           <Checkbox
                                checked={returns.length > 0 && selectedReturns.size === returns.length}
                                onCheckedChange={handleSelectAll}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Date & Flux</TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Origine Facture</TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Partenaire Client</TableHead>
                        <TableHead className="p-6 text-right font-semibold text-[10px] uppercase text-muted-foreground/60">Remboursé</TableHead>
                        <TableHead className="p-6 text-right font-semibold text-[10px] uppercase text-primary">Valeur Retour</TableHead>
                        <TableHead className="p-6 w-[80px]"></TableHead>
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
                                    "group transition-all border-b border-white/5 cursor-pointer",
                                    isSelected ? "bg-primary/10" : "hover:bg-primary/5"
                                )}
                            >
                                <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(r.uuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>
                                <TableCell className="p-6 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-black/20 text-muted-foreground/40 shadow-inner">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col -space-y-0.5">
                                            <span className="font-bold text-xs">{format(safeToDate(r.createdAt!), 'dd MMM yyyy', { locale: fr })}</span>
                                            <span className="text-[9px] text-muted-foreground/40 uppercase font-semibold tracking-wide">{format(safeToDate(r.createdAt!), 'HH:mm')}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground/60 bg-muted/20 px-3 py-1.5 rounded-xl w-fit border border-white/5">
                                        <Hash className="h-3 w-3 opacity-30" />
                                        {r.originalInvoiceNumber}
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
                                <TableCell className="p-6 text-right font-mono text-xs text-emerald-500 font-bold">
                                    {formatCurrency(r.amountRefunded)}
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    <span className="font-semibold text-primary text-base tracking-tighter font-mono">
                                        {formatCurrency(r.totalReturnValue)}
                                    </span>
                                </TableCell>
                                <TableCell className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted group-hover:bg-background/50 transition-all">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-sm bg-card">
                                            <DropdownMenuItem onClick={() => onViewDetails(r)} className="rounded-xl p-3">
                                                <FileText className="mr-2 h-4 w-4" /> Details Elite
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onCancel(r)} className="text-destructive focus:text-destructive rounded-xl p-3">
                                                <Trash2 className="mr-2 h-4 w-4" /> Annuler Retour
                                            </DropdownMenuItem>
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
