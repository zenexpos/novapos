'use client';

import React, { useState, useEffect } from 'react';
import type { Product, StockStatus } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal, Edit, Trash2, Copy, TrendingUp, TrendingDown
} from 'lucide-react';
import { cn, formatCurrency, calculateMarginRate } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

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

const stockCfg: Record<StockStatus, { label: string; text: string; dot: string }> = {
    in_stock:    { label: 'Stock',     text: 'text-emerald-700', dot: 'bg-emerald-500' },
    low_stock:   { label: 'Bas',       text: 'text-amber-700',   dot: 'bg-amber-500' },
    out_of_stock: { label: 'Rupture',   text: 'text-red-700',     dot: 'bg-red-500 animate-pulse' },
    overstock:   { label: 'Excédent',  text: 'text-blue-700',    dot: 'bg-blue-500' },
};

const ProductCardComponent = ({
    product, onEdit, onDuplicate, onDelete,
    isSelected, onToggleSelection, isSelectionActive,
}: ProductCardProps) => {
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
                'group relative flex flex-col rounded-xl overflow-hidden cursor-pointer border transition-all duration-150',
                isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:border-primary/40 bg-card/30',
            )}
        >
            <div className="flex items-center justify-between p-3 pb-1">
                <div className="flex items-center gap-1.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", stock.dot)} />
                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", stock.text)}>{stock.label}</span>
                </div>

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-3.5 w-3.5 border-primary data-[state=checked]:bg-primary"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                                <MoreHorizontal className="h-3.5 w-3.5 opacity-30" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onEdit(product)} className="text-xs font-bold p-2"><Edit className="mr-2 h-3.5 w-3.5" /> Éditer</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(product)} className="text-xs font-bold p-2"><Copy className="mr-2 h-3.5 w-3.5" /> Copier</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive text-xs font-bold p-2"><Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="px-3 pb-2 flex-grow">
                <h3 className="font-bold text-[11px] leading-tight line-clamp-2 uppercase tracking-tight">
                    {product.name}
                </h3>
            </div>

            <div className="px-3 pb-3">
                <div className="h-0.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                    <div
                        className={cn('h-full rounded-full transition-all duration-700', stock.dot)}
                        style={{ width: `${Math.max(5, stockPercent)}%` }}
                    />
                </div>
                
                <div className="flex items-end justify-between">
                    <div className="space-y-0">
                        <p className="text-[13px] font-black text-primary tabular-nums tracking-tighter">
                            {formatCurrency(product.price)}
                        </p>
                        <p className="text-[8px] font-bold text-muted-foreground/50 uppercase">{product.quantity} {product.unit ?? 'u'}</p>
                    </div>

                    <div className={cn(
                        'flex items-center gap-1 px-1 py-0.5 rounded-md border font-black text-[8px]',
                        isGoodMargin ? 'bg-emerald-50/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-50/10 text-amber-600 border-amber-500/20',
                    )}>
                        {isGoodMargin ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                        {marginRate.toFixed(0)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProductCard = React.memo(ProductCardComponent);