'use client';

import React from 'react';
import type { Expense } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Banknote, Calendar, Tag, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, cn, safeToDate } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

interface ExpenseCardProps {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
}

const ExpenseCardComponent = ({ expense, onEdit, onDelete, isSelected, onToggleSelection }: ExpenseCardProps) => {
    
    const handleCardClick = () => {
        onToggleSelection();
    };

    return (
        <Card 
            onClick={handleCardClick}
            className={cn(
                "app-card group flex flex-col transition-all duration-500 bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden rounded-lg cursor-pointer",
                isSelected ? "ring-2 ring-primary border-primary/30 shadow-sm scale-[1.02]" : "hover:bg-primary/5"
            )}
        >
            <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                <Banknote className="h-32 w-32 rotate-12" />
            </div>

            {/* Actions isolated container */}
            <div 
                className="absolute top-4 right-4 z-10 flex gap-2 items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-1.5 bg-background/80 backdrop-blur-md rounded-xl border border-white/5 shadow-sm flex items-center justify-center">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-9 w-9 bg-background/80 backdrop-blur-md border-white/5 shadow-xl rounded-xl transition-all"
                        >
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
            </div>

            <CardHeader className="p-6 pb-2 space-y-3 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-destructive/5 text-destructive transition-all group-hover:bg-destructive/10 shadow-inner">
                        <Banknote className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 pr-12">
                        <CardTitle className="text-xl font-semibold leading-tight tracking-tighter group-hover:text-primary transition-colors truncate">
                            {expense.description}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="px-3 py-1 rounded-xl bg-primary/5 text-primary text-[9px] font-semibold uppercase flex items-center gap-1.5 border border-primary/10">
                                <Tag className="h-2.5 w-2.5 opacity-50" /> {expense.category}
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 py-4 relative z-10">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wide bg-black/20 px-4 py-2 rounded-2xl w-fit border border-white/5 shadow-inner">
                    <Calendar className="h-3 w-3 opacity-50" />
                    <span>{format(safeToDate(expense.expenseDate), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-4 border-t border-white/5 bg-muted/5 flex items-center justify-between relative z-10">
                 <div className="space-y-0.5">
                    <p className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wide">Décaissement Flux</p>
                    <p className="text-xl font-semibold text-destructive tracking-tighter leading-none">{formatCurrency(expense.amount)}</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onEdit(expense); }}
                    className="h-9 rounded-xl font-semibold text-[10px] uppercase tracking-wide hover:bg-primary/10 hover:text-primary transition-all px-4"
                >
                    Détails <ChevronRight className="ml-1 h-3 w-3 opacity-50" />
                </Button>
            </CardFooter>
        </Card>
    );
}

export const ExpenseCard = React.memo(ExpenseCardComponent);
