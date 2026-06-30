'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { Product, StockStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal, Edit, Trash2, CalendarClock, Package,
    Copy, History, TrendingUp, TrendingDown, AlertTriangle,
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

const stockCfg: Record<StockStatus, { label: string; bg: string; text: string; border: string; dot: string; Icon: React.ElementType }> = {
    in_stock:    { label: 'En stock',   bg: 'bg-emerald-50/15', text: 'text-emerald-700', border: 'border-emerald-500/20', dot: 'bg-emerald-500', Icon: CheckCircle2  },
    low_stock:   { label: 'Stock bas',  bg: 'bg-amber-50/15',   text: 'text-amber-700',   border: 'border-amber-500/20',   dot: 'bg-amber-500',   Icon: AlertTriangle },
    out_of_stock: { label: 'Rupture',    bg: 'bg-red-50/15',     text: 'text-red-700',     border: 'border-red-500/20',     dot: 'bg-red-500 animate-pulse', Icon: XCircle       },
    overstock:   { label: 'Excédent',   bg: 'bg-blue-50/15',    text: 'text-blue-700',    border: 'border-blue-500/20',    dot: 'bg-blue-500',    Icon: Package       },
};

/**
 * UI AUDIT FIX:
 * - Boosting font sizes for better legibility (Fiche Produit).
 * - Standardized spacing and depth.
 * - Added ARIA labels for icon actions.
 */
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
        if (days < 0)   return { label: 'EXPIRÉ',         cls: 'text-red-700 bg-red-50 border-red-500/30' };
        if (days <= 7)  return { label: `${days}J RESTANTS`, cls: 'text-red-600 bg-red-50/10 border-red-400/20' };
        if (days <= 30) return { label: `${days}J RESTANTS`, cls: 'text-amber-700 bg-amber-50 border-amber-400/30' };
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
                'group relative flex flex-col rounded-3xl overflow-hidden cursor-pointer',
                'transition-all duration-300 ease-out',
                'border-2 bg-[var(--glass-bg)] backdrop-blur-sm',
                isSelected
                    ? 'border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15),0_12px_40px_rgba(0,0,0,0.25)] scale-[1.02]'
                    : 'border-[var(--glass-border)] hover:border-primary/40 hover:shadow-lg',
            )}
        >
            <div className={cn(
                'absolute inset-x-0 top-0 h-1 transition-all duration-300',
                product.stockStatus === 'in_stock'  && 'bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent',
                product.stockStatus === 'low_stock' && 'bg-gradient-to-r from-transparent via-amber-500/60 to-transparent',
                product.stockStatus === 'out_of_stock' && 'bg-gradient-to-r from-transparent via-red-500/70 to-transparent',
                product.stockStatus === 'overstock' && 'bg-gradient-to-r from-transparent via-blue-500/60 to-transparent',
            )} />

            <div className="flex items-start justify-between p-6 pb-4">
                <span className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] border-2 shadow-sm',
                    stock.bg, stock.text, stock.border,
                )}>
                    <span className={cn('w-2.5 h-2.5 rounded-full', stock.dot)} />
                    {stock.label}
                </span>

                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-xl border-2 transition-all',
                        isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-muted/20 border-border opacity-0 group-hover:opacity-100',
                    )}>
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggleSelection}
                            className="h-5 w-5 border-0"
                            aria-label="Sélectionner le produit"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Plus d'actions"
                                className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-primary/15">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 border-none shadow-2xl">
                            <DropdownMenuItem onClick={() => onEdit(product)} className="rounded-xl p-3">
                                <Edit className="mr-3 h-4 w-4" /> Modifier Fiche
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(product)} className="rounded-xl p-3">
                                <Copy className="mr-3 h-4 w-4" /> Dupliquer Item
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onHistory(product)} className="rounded-xl p-3">
                                <History className="mr-3 h-4 w-4" /> Historique Flux
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="opacity-10" />
                            <DropdownMenuItem onClick={() => onDelete(product)}
                                className="text-destructive focus:text-destructive rounded-xl p-3">
                                <Trash2 className="mr-3 h-4 w-4" /> Révoquer Item
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="px-6 pb-5 flex-1">
                <h3 className="font-black text-lg leading-tight tracking-tight line-clamp-2 group-hover:text-primary transition-colors mb-3">
                    {product.name}
                </h3>

                <div className="flex items-center gap-3 flex-wrap">
                    {product.unit && (
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40">
                            {product.unit}
                        </span>
                    )}
                    {product.barcodes && product.barcodes.length > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <span className="flex items-center gap-2 text-[11px] font-black text-muted-foreground/50 uppercase tracking-widest">
                                        <Barcode className="h-4 w-4" />
                                        {product.barcodes.length} CODE
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-2xl p-4 shadow-2xl">
                                    <p className="text-[12px] font-mono font-bold">{product.barcodes.join(', ')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {expiryBadge && (
                        <span className={cn('flex items-center gap-2 text-[11px] font-black px-3 py-1.5 rounded-xl border-2 uppercase tracking-tighter', expiryBadge.cls)}>
                            <CalendarClock className="h-3.5 w-3.5" />
                            {expiryBadge.label}
                        </span>
                    )}
                </div>
            </div>

            <div className="px-6 pb-6">
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                        <Package className={cn('h-4 w-4', stock.text)} />
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/50">Flux en Stock</span>
                    </div>
                    <span className={cn('text-base font-black tabular-nums', stock.text)}>
                        {product.quantity}
                        <span className="text-[11px] font-bold text-muted-foreground/30 ml-2 uppercase opacity-50">{product.unit ?? 'u'}</span>
                    </span>
                </div>
                <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden shadow-inner">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-1000 ease-out',
                            product.stockStatus === 'in_stock'  && 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
                            product.stockStatus === 'low_stock' && 'bg-amber-500',
                            product.stockStatus === 'out_of_stock' && 'bg-red-600',
                            product.stockStatus === 'overstock' && 'bg-blue-600',
                        )}
                        style={{ width: `${Math.max(4, stockPercent)}%` }}
                    />
                </div>
            </div>

            <div className="border-t border-border/60 bg-muted/5 px-6 py-5 mt-auto group-hover:bg-muted/10 transition-all">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Valeur de Vente</p>
                        <p className="text-3xl font-black text-primary tracking-tighter tabular-nums leading-none">
                            {formatCurrency(product.price)}
                        </p>
                    </div>

                    <div className={cn(
                        'flex items-center gap-1.5 px-4 py-2 rounded-2xl border-2 font-black text-[12px] shadow-sm transition-transform group-hover:scale-110',
                        isGoodMargin
                            ? 'bg-emerald-50/15 text-emerald-700 border-emerald-500/20'
                            : 'bg-amber-50/15 text-amber-700 border-amber-500/20',
                    )}>
                        {isGoodMargin
                            ? <TrendingUp className="h-4 w-4" />
                            : <TrendingDown className="h-4 w-4" />}
                        {formatPercent(marginRate, 0)}
                    </div>
                </div>
            </div>
            
            <div className="px-6 py-3 border-t border-border/40 bg-black/[0.01] flex justify-between items-center">
                <span className="text-[11px] font-bold text-muted-foreground/30 uppercase tracking-[0.1em]">
                    {lastUpdate ?? 'Catalogue Global'}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
        </div>
    );
};

export const ProductCard = React.memo(ProductCardComponent);