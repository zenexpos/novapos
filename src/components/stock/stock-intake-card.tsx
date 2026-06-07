'use client';

import React from 'react';
import type { StockIntake } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Calendar, Hash, Building, ShoppingBag, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency } from '@/lib/utils';

interface StockIntakeCardProps {
    intake: StockIntake;
    supplierName?: string;
    onViewDetails: (intake: StockIntake) => void;
    onCancelIntake: (intake: StockIntake) => void;
}

const StockIntakeCardComponent = ({ intake, supplierName, onViewDetails, onCancelIntake }: StockIntakeCardProps) => {
    const name = supplierName || 'Partenaire Inconnu';

    const handleCardClick = () => {
        onViewDetails(intake);
    };

    return (
        <Card onClick={handleCardClick} className="app-card group flex flex-col justify-between transition-all duration-500 bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden rounded-lg cursor-pointer">
            <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                <Archive className="h-32 w-32 rotate-12" />
            </div>

            {/* Actions isolated container */}
            <div 
                className="absolute top-4 right-4 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-9 w-9 bg-background/80 backdrop-blur-md border-white/5 shadow-xl rounded-xl transition-transform active:scale-95">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-sm bg-card">
                        <DropdownMenuItem onClick={() => onViewDetails(intake)} className="rounded-xl p-3">
                            <FileText className="mr-2 h-4 w-4" /> Détails du bon
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCancelIntake(intake)} className="text-destructive focus:text-destructive rounded-xl p-3">
                            <Trash2 className="mr-2 h-4 w-4" /> Annuler l'entrée
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardHeader className="p-6 pb-2">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-inner">
                        <Building className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 pr-10">
                        <CardTitle className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors truncate">
                            {name}
                        </CardTitle>
                        <p className="text-[10px] font-mono font-semibold uppercase text-muted-foreground/40 mt-1 flex items-center gap-1 tracking-wide">
                            <Hash className="h-2.5 w-2.5" /> {intake.invoiceNumber || 'No ID'}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-muted/20 border border-white/5">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/40 mb-1 flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" /> Date
                        </p>
                        <p className="text-xs font-bold">{format(safeToDate(intake.createdAt!), 'dd MMM yyyy', { locale: fr })}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/20 border border-white/5">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/40 mb-1 flex items-center gap-1">
                            <ShoppingBag className="h-2.5 w-2.5" /> Articles
                        </p>
                        <p className="text-xs font-bold">{intake.items.length} Types</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-3 border-t border-white/5 bg-muted/5 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-lg font-semibold text-primary tracking-tighter leading-none">{formatCurrency(intake.totalValue)}</p>
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-tight opacity-40">Investissement Total</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 rounded-xl font-semibold text-[10px] uppercase tracking-wide hover:bg-primary/10 hover:text-primary transition-all px-4"
                >
                    Examiner
                </Button>
            </CardFooter>
        </Card>
    );
};

export const StockIntakeCard = React.memo(StockIntakeCardComponent);
