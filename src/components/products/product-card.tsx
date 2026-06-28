'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { Product, StockStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal, Edit, Trash2, CalendarClock, Package,
    Copy, History, TrendingUp, TrendingDown, AlertTriangle,
    CheckCircle2, XCircle, Barcode
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

const stockCfg: Record<StockStatus, { label: string; bg: string; text: string; border: string; dot: string; Icon: React.ElementType }> = {
    in_stock:    { label: 'En stock',   bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', dot: 'bg-emerald-500', Icon: CheckCircle2  },
    low_stock:   { label: 'Stock bas',  bg: 'bg-amber-500/10',   text: 'text-amber-500',   border: 'border-amber-500/20',   dot: 'bg-amber-500',   Icon: AlertTriangle },
    out_of_stock: { label: 'Rupture',    bg: 'bg-red-500/10',     text: 'text-red-500',     border: 'border-red-500/20',     dot: 'bg-red-500',     Icon: XCircle       },
    overstock:   { label: 'Excédent',   bg: 'bg-blue-500/10',    text: 'text-blue-500',    border: 'border-blue-500/20',    dot: 'bg-blue-500',    Icon: Package       },
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

    const expiryBadge = useMemo(() => {
        if (!product.dateExpiration) return null;
        const days = differenceInDays(new Date(product.dateExpiration), new Date());
        if (days < 0)   return { label: 'Expiré',         cls: 'text-red-500 bg-red-500/10 border-red-500/20' };
        if (days <= 7)  return { label: `${days}j restants`, cls: 'text-red-400 bg-red-500/8 border-red-400/20' };
        if (days <= 30) return { label: `${days}j restants`, cls: 'text-amber-400 bg-amber-500/8 border-amber-400/20' };
        return null;
    }, [product.dateExpiration]);

    const lastUpdate = useMemo(() => {
        if (!isMounted || !product.updatedAt) return null;
        return formatDistanceToNow(safeToDate(product.updatedAt), { addSuffix: true, locale: fr });
    }, [isMounted, product.updatedAt]);

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
                'transition-all duration-300 ease-out',
                'border bg-[var(--glass-bg)] backdrop-blur-sm',
                isSelected
                    ? 'border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.5),0_8px_32px_rgba(0,0,0,0.25)] scale-[1.01]'
                    : 'border-[var(--glass-border)] hover:border-primary/30 hover:shadow-sm',
            )}
        >
            <div className={cn(
                'absolute inset-x-0 top-0 h-0.5 transition-all duration-300',
                product.stockStatus === 'in_stock'  && 'bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent',
                product.stockStatus === 'low_stock' && 'bg-gradient-to-r from-transparent via-amber-500/60 to-transparent',
                product.stockStatus === 'out_of_stock' && 'bg-gradient-to-r from-transparent via-red-500/60 to-transparent',
                product.stockStatus === 'overstock' && 'bg-gradient-to-r from-transparent via-blue-500/60 to-transparent',
            )} />

            <div className="flex items-start justify-between p-4 pb-2">
                <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border',
                    stock.bg, stock.text, stock.border,
                )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', stock.dot)} />
                    {stock.label}
                </span>

                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <div className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-lg border transition-all',
                        isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-[var(--glass-bg)] border-[var(--glass-border)] opacity-0 group-hover:opacity-100',
                    )}>
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggleSelection}
                            className="h-3.5 w-3.5 border-0 data-[state=checked]:bg-transparent data-[state=checked]:text-white"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"
                                className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-all">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => onEdit(product)}>
                                <Edit className="mr-2 h-3.5 w-3.5" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(product)}>
                                <Copy className="mr-2 h-3.5 w-3.5" /> Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onHistory(product)}>
                                <History className="mr-2 h-3.5 w-3.5" /> Historique
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(product)}
                                className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="px-4 pb-3 flex-1">
                <h3 className="font-black text-base leading-tight tracking-tight line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
                    {product.name}
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                    {product.unit && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 px-2 py-0.5 rounded-md bg-muted/40 border border-muted">
                            {product.unit}
                        </span>
                    )}
                    {product.barcodes && product.barcodes.length > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/40">
                                        <Barcode className="h-3 w-3" />
                                        {product.barcodes.length}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">{product.barcodes.join(', ')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {expiryBadge && (
                        <span className={cn('flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border', expiryBadge.cls)}>
                            <CalendarClock className="h-2.5 w-2.5" />
                            {expiryBadge.label}
                        </span>
                    )}
                </div>
            </div>

            <div className="px-4 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                        <Package className={cn('h-3 w-3', stock.text)} />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Stock</span>
                    </div>
                    <span className={cn('text-sm font-black tabular-nums', stock.text)}>
                        {product.quantity}
                        <span className="text-[9px] font-semibold text-muted-foreground/40 ml-1">{product.unit ?? 'u'}</span>
                    </span>
                </div>
                <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-700',
                            product.stockStatus === 'in_stock'  && 'bg-emerald-500',
                            product.stockStatus === 'low_stock' && 'bg-amber-500',
                            product.stockStatus === 'out_of_stock' && 'bg-red-500',
                            product.stockStatus === 'overstock' && 'bg-blue-500',
                        )}
                        style={{ width: `${Math.max(3, stockPercent)}%` }}
                    />
                </div>
            </div>

            <div className="border-t border-[var(--glass-border)] bg-muted/5 px-4 py-3">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-0.5">Prix vente</p>
                        <p className="text-xl font-black text-primary tracking-tighter tabular-nums leading-none">
                            {formatCurrency(product.price)}
                        </p>
                    </div>

                    <div className={cn(
                        'flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-black',
                        isGoodMargin
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                    )}>
                        {isGoodMargin
                            ? <TrendingUp className="h-3 w-3" />
                            : <TrendingDown className="h-3 w-3" />}
                        {formatPercent(marginRate)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProductCard = React.memo(ProductCardComponent);
