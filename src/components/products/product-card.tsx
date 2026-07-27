'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { Product, StockStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal, Edit, Trash2, CalendarClock, Package,
    Copy, History, TrendingUp, TrendingDown, TriangleAlert,
    CheckCircle2, XCircle, Barcode, ChevronRight
} from 'lucide-react';
import { cn, formatCurrency, formatPercent, calculateMarginRate, safeToDate } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDuplicate: (product: Product) => void;
    onHistory: (product: Product) => void;
    onDelete: (product: Product) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
    isSelectionActive: boolean;
}

const stockCfg: Record<StockStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
    in_stock:    { label: 'Stock',     bg: 'bg-emerald-50/15', text: 'text-emerald-700', border: 'border-emerald-500/10', dot: 'bg-emerald-500' },
    low_stock:   { label: 'Faible',    bg: 'bg-amber-50/15',   text: 'text-amber-700',   border: 'border-amber-500/10',   dot: 'bg-amber-500' },
    out_of_stock: { label: 'Rupture',   bg: 'bg-red-50/15',     text: 'text-red-700',     border: 'border-red-500/10',     dot: 'bg-red-500 animate-pulse' },
    overstock:   { label: 'Excédent',  bg: 'bg-blue-50/15',    text: 'text-blue-700',    border: 'border-blue-500/10',    dot: 'bg-blue-500' },
};

const ProductCardComponent = ({
    product, onEdit, onDuplicate, onHistory, onDelete,
    isSelected, onToggleSelection, isSelectionActive,
}: ProductCardProps) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const stock = stockCfg[product.stockStatus ?? 'in_stock'];
    const marginRate = calculateMarginRate(product.price, product.purchasePrice);
    const isGoodMargin = marginRate >= 20;

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button, input, [role="menuitem"]')) return;
        if (isSelectionActive) { onToggleSelection(); } else { onEdit(product); }
    };

    const stockPercent = product.minStockLevel > 0
        ? Math.min(100, (product.quantity / (product.minStockLevel * 3)) * 100)
        : Math.min(100, product.quantity * 10);

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                'group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer',
                'transition-all duration-200 border-2 bg-[var(--glass-bg)]',
                isSelected
                    ? 'border-primary shadow-xl scale-[1.01]'
                    : 'border-[var(--glass-border)] hover:border-primary/20',
            )}
        >
            <div className="flex items-center justify-between p-3 pb-2">
                <span className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border',
                    stock.bg, stock.text, stock.border,
                )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', stock.dot)} />
                    {stock.label}
                </span>

                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors">
                                <MoreHorizontal className="h-4 w-4 opacity-30" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl border-white/5">
                            <DropdownMenuItem onClick={() => onEdit(product)} className="text-xs font-bold uppercase p-2.5"><Edit className="mr-2 h-3.5 w-3.5" /> Éditer</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(product)} className="text-xs font-bold uppercase p-2.5"><Copy className="mr-2 h-3.5 w-3.5" /> Copier</DropdownMenuItem>
                            <DropdownMenuSeparator className="opacity-10" />
                            <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive text-xs font-bold uppercase p-2.5"><Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="px-3 pb-3 flex-grow min-h-0">
                <h3 className="font-black text-xs leading-tight tracking-tight line-clamp-2 uppercase group-hover:text-primary transition-colors">
                    {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/30 px-1.5 py-0.5 rounded-md bg-muted/20">{product.category || 'Item'}</span>
                    {product.barcodes?.[0] && <span className="text-[8px] font-mono text-muted-foreground/20 truncate">{product.barcodes[0]}</span>}
                </div>
            </div>

            <div className="px-3 pb-3">
                <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden mb-3">
                    <div
                        className={cn('h-full rounded-full transition-all duration-1000', stock.dot)}
                        style={{ width: `${Math.max(5, stockPercent)}%` }}
                    />
                </div>
                
                <div className="flex items-end justify-between">
                    <div className="space-y-0.5">
                        <p className="text-[14px] font-black text-primary tabular-nums tracking-tighter">
                            {formatCurrency(product.price)}
                        </p>
                        <p className="text-[8px] font-bold text-muted-foreground/30 uppercase">{product.quantity} {product.unit ?? 'u'}</p>
                    </div>

                    <div className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded-md border font-black text-[9px]',
                        isGoodMargin ? 'bg-emerald-50/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-50/10 text-amber-600 border-amber-500/20',
                    )}>
                        {isGoodMargin ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                        {marginRate.toFixed(0)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProductCard = React.memo(ProductCardComponent);
