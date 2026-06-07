'use client';

import React from 'react';
import type { Expense } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Banknote, Calendar, Tag, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, cn, safeToDate } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';

interface ExpenseTableProps {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
    selectedExpenses: Set<string>;
    onToggleSelection: (uuid: string) => void;
    onToggleSelectAll: () => void;
}

export function ExpenseTable({ 
    expenses, 
    onEdit, 
    onDelete, 
    selectedExpenses, 
    onToggleSelection, 
    onToggleSelectAll 
}: ExpenseTableProps) {
    return (
        <div className="rounded-lg border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="w-[60px] px-6">
                           <Checkbox
                                checked={expenses.length > 0 && selectedExpenses.size === expenses.length}
                                onCheckedChange={onToggleSelectAll}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Horodatage</TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Désignation de la Charge</TableHead>
                        <TableHead className="p-6 font-semibold text-[10px] uppercase text-muted-foreground/60">Poste Analytique</TableHead>
                        <TableHead className="p-6 text-right font-semibold text-[10px] uppercase text-destructive">Montant Décaissé</TableHead>
                        <TableHead className="p-6 w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {expenses.map((expense) => {
                        const isSelected = selectedExpenses.has(expense.uuid);

                        return (
                            <TableRow 
                                key={expense.uuid} 
                                onClick={() => onToggleSelection(expense.uuid)}
                                className={cn(
                                    "group transition-all border-b border-white/5 cursor-pointer",
                                    isSelected ? "bg-primary/10" : "hover:bg-primary/5"
                                )}
                            >
                                <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(expense.uuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>
                                <TableCell className="p-6 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-black/20 text-muted-foreground/40 shadow-inner">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col -space-y-0.5">
                                            <span className="font-bold text-xs">{format(safeToDate(expense.expenseDate), 'dd MMM yyyy', { locale: fr })}</span>
                                            <span className="text-[9px] text-muted-foreground/40 uppercase font-semibold tracking-wide">Flux validé</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-destructive/5 text-destructive/40 shadow-inner">
                                            <Banknote className="h-4 w-4" />
                                        </div>
                                        <span className="font-semibold tracking-tight text-sm group-hover:text-primary transition-colors">
                                            {expense.description}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="p-6">
                                    <Badge variant="outline" className="gap-2 px-3 py-1.5 rounded-xl border-white/10 bg-muted/20 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                                        <Tag className="h-3 w-3 opacity-40" /> {expense.category}
                                    </Badge>
                                </TableCell>
                                <TableCell className="p-6 text-right">
                                    <span className="font-semibold text-destructive text-base tracking-tighter font-mono">
                                        {formatCurrency(expense.amount)}
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
                                            <DropdownMenuItem onClick={() => onEdit(expense)} className="rounded-xl p-3">
                                                <Edit className="mr-2 h-4 w-4" /> Modifier
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive focus:text-destructive rounded-xl p-3">
                                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
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
