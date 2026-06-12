'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Supplier } from '@/lib/types';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal, Edit, Trash2, CalendarClock, Package,
    Copy, History, Building, ChevronUp, ChevronDown, ChevronsUpDown,
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react';
import {
    cn, formatCurrency, formatPercent, calculateMarginRate, safeToDate,
} from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '../ui/tooltip';

interface ProductTableProps {
    products: Product[];
    onEdit:      (p: Product) => void;
    onDuplicate: (p: Product) => void;
    onHistory:   (p: Product) => void;
    onDelete:    (p: Product) => void;
    selectedProducts: Set<string>;
    onToggleProductSelection: (uuid: string) => void;
    onToggleSelectAll: () => void;
    suppliers: Supplier[];
}

type SortKey  = 'name' | 'quantity' | 'price' | 'purchasePrice' | 'margin' | 'updatedAt';
type SortDir  = 'asc' | 'desc';

const stockCfg = {
    in_stock:    { Icon: CheckCircle2,  cls: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'En stock'   },
    low_stock:   { Icon: AlertTriangle, cls: 'text-amber-500  bg-amber-500/10  border-amber-500/20',  label: 'Stock bas'  },
    out_of_stock:{ Icon: XCircle,       cls: 'text-red-500    bg-red-500/10    border-red-500/20',    label: 'Rupture'    },
} as const;

function SortIcon({ col, sortKey, sortDir }:
    { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
    if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc'
        ? <ChevronUp   className="h-3 w-3 text-primary" />
        : <ChevronDown className="h-3 w-3 text-primary" />;
}

export function ProductTable({
    products, onEdit, onDuplicate, onHistory, onDelete,
    selectedProducts, onToggleProductSelection, onToggleSelectAll,
    suppliers,
}: ProductTableProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [sortKey, setSortKey]     = useState<SortKey>('updatedAt');
    const [sortDir, setSortDir]     = useState<SortDir>('desc');

    useEffect(() => { setIsMounted(true); }, []);

    const supplierMap = useMemo(
        () => new Map(suppliers.map(s => [s.uuid, s.name])),
        [suppliers],
    );

    const toggleSort = (key: SortKey) => {
        if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const sorted = useMemo(() => {
        return [...products].sort((a, b) => {
            let va: number | string = 0;
            let vb: number | string = 0;
            if (sortKey === 'name')          { va = a.name;          vb = b.name; }
            if (sortKey === 'quantity')      { va = a.quantity;      vb = b.quantity; }
            if (sortKey === 'price')         { va = a.price;         vb = b.price; }
            if (sortKey === 'purchasePrice') { va = a.purchasePrice; vb = b.purchasePrice; }
            if (sortKey === 'margin')        {
                va = calculateMarginRate(a.price, a.purchasePrice);
                vb = calculateMarginRate(b.price, b.purchasePrice);
            }
            if (sortKey === 'updatedAt') {
                va = safeToDate(a.updatedAt).getTime();
                vb = safeToDate(b.updatedAt).getTime();
            }
            if (typeof va === 'string')
                return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
            return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
        });
    }, [products, sortKey, sortDir]);

    const allSelected = products.length > 0 && selectedProducts.size === products.length;

    const thCls = 'px-3 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap';
    const thBtn = 'flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors';

    return (
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-[var(--glass-border)] hover:bg-transparent">
                        {/* Checkbox */}
                        <TableHead className="w-12 px-4">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={onToggleSelectAll}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                        </TableHead>

                        {/* Produit */}
                        <TableHead className={thCls}>
                            <button className={thBtn} onClick={() => toggleSort('name')}>
                                Produit <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        {/* État */}
                        <TableHead className={thCls}>État</TableHead>

                        {/* Fournisseur */}
                        <TableHead className={cn(thCls, 'hidden lg:table-cell')}>Fournisseur</TableHead>

                        {/* Stock */}
                        <TableHead className={thCls}>
                            <button className={thBtn} onClick={() => toggleSort('quantity')}>
                                Stock <SortIcon col="quantity" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        {/* PMP */}
                        <TableHead className={cn(thCls, 'text-right hidden md:table-cell')}>
                            <button className={cn(thBtn, 'ml-auto')} onClick={() => toggleSort('purchasePrice')}>
                                PMP <SortIcon col="purchasePrice" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        {/* Prix vente */}
                        <TableHead className={cn(thCls, 'text-right')}>
                            <button className={cn(thBtn, 'ml-auto')} onClick={() => toggleSort('price')}>
                                Prix <SortIcon col="price" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        {/* Marge */}
                        <TableHead className={cn(thCls, 'text-right hidden sm:table-cell')}>
                            <button className={cn(thBtn, 'ml-auto')} onClick={() => toggleSort('margin')}>
                                Marge <SortIcon col="margin" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        {/* Actions */}
                        <TableHead className="w-10 px-2" />
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {sorted.map((product) => {
                        const isSelected = selectedProducts.has(product.uuid);
                        const stock      = stockCfg[product.stockStatus ?? 'in_stock'];
                        const marginRate = calculateMarginRate(product.price, product.purchasePrice);
                        const isGoodMargin = marginRate >= 20;

                        const expiryDays = product.dateExpiration
                            ? differenceInDays(new Date(product.dateExpiration), new Date())
                            : null;

                        const updatedAt = isMounted && product.updatedAt
                            ? formatDistanceToNow(safeToDate(product.updatedAt), { addSuffix: true, locale: fr })
                            : null;

                        const supplierName = product.supplierUuid
                            ? supplierMap.get(product.supplierUuid)
                            : null;

                        return (
                            <TableRow
                                key={product.uuid}
                                onClick={() => onToggleProductSelection(product.uuid)}
                                className={cn(
                                    'group border-b border-[var(--glass-border)] cursor-pointer transition-all duration-150',
                                    isSelected
                                        ? 'bg-primary/8 border-l-2 border-l-primary'
                                        : 'hover:bg-primary/4',
                                )}
                            >
                                {/* Checkbox */}
                                <TableCell className="px-4" onClick={e => e.stopPropagation()}>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => onToggleProductSelection(product.uuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>

                                {/* Produit */}
                                <TableCell className="px-3 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-black text-sm leading-tight group-hover:text-primary transition-colors truncate max-w-[220px]">
                                            {product.name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {product.unit && (
                                                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                                                    {product.unit}
                                                </span>
                                            )}
                                            {expiryDays !== null && expiryDays <= 30 && (
                                                <span className={cn(
                                                    'flex items-center gap-0.5 text-[9px] font-bold',
                                                    expiryDays < 0 ? 'text-red-500' : 'text-amber-500',
                                                )}>
                                                    <CalendarClock className="h-2.5 w-2.5" />
                                                    {expiryDays < 0 ? 'Expiré' : `${expiryDays}j`}
                                                </span>
                                            )}
                                        </div>
                                        {updatedAt && (
                                            <span className="text-[8px] text-muted-foreground/25 mt-0.5">
                                                {updatedAt}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>

                                {/* État */}
                                <TableCell className="px-3 py-3">
                                    <span className={cn(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide border',
                                        stock.cls,
                                    )}>
                                        <stock.Icon className="h-2.5 w-2.5" />
                                        {stock.label}
                                    </span>
                                </TableCell>

                                {/* Fournisseur */}
                                <TableCell className="px-3 py-3 hidden lg:table-cell">
                                    {supplierName ? (
                                        <div className="flex items-center gap-1.5">
                                            <Building className="h-3 w-3 text-muted-foreground/40" />
                                            <span className="text-[11px] font-semibold text-muted-foreground/70 truncate max-w-[120px]">
                                                {supplierName}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground/25 italic">—</span>
                                    )}
                                </TableCell>

                                {/* Stock */}
                                <TableCell className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            'flex items-center justify-center w-7 h-7 rounded-lg',
                                            product.stockStatus === 'out_of_stock'
                                                ? 'bg-red-500/10 text-red-500'
                                                : product.stockStatus === 'low_stock'
                                                    ? 'bg-amber-500/10 text-amber-500'
                                                    : 'bg-emerald-500/10 text-emerald-500',
                                        )}>
                                            <Package className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black tabular-nums leading-none">
                                                {product.quantity}
                                            </p>
                                            <p className="text-[8px] font-semibold text-muted-foreground/30 uppercase">
                                                {product.unit ?? 'u'}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* PMP */}
                                <TableCell className="px-3 py-3 text-right hidden md:table-cell">
                                    <span className="font-mono text-[11px] font-bold text-muted-foreground/50 tabular-nums">
                                        {formatCurrency(product.purchasePrice)}
                                    </span>
                                </TableCell>

                                {/* Prix vente */}
                                <TableCell className="px-3 py-3 text-right">
                                    <span className="font-mono text-sm font-black text-primary tabular-nums">
                                        {formatCurrency(product.price)}
                                    </span>
                                </TableCell>

                                {/* Marge */}
                                <TableCell className="px-3 py-3 text-right hidden sm:table-cell">
                                    <span className={cn(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border',
                                        isGoodMargin
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                                    )}>
                                        {isGoodMargin
                                            ? <TrendingUp className="h-2.5 w-2.5" />
                                            : <TrendingDown className="h-2.5 w-2.5" />}
                                        {formatPercent(marginRate)}
                                    </span>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="px-2 py-3" onClick={e => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"
                                                className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-all">
                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem onClick={() => onEdit(product)}>
                                                <Edit    className="mr-2 h-3.5 w-3.5" /> Modifier
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDuplicate(product)}>
                                                <Copy    className="mr-2 h-3.5 w-3.5" /> Dupliquer
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onHistory(product)}>
                                                <History className="mr-2 h-3.5 w-3.5" /> Historique
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onDelete(product)}
                                                className="text-destructive focus:text-destructive">
                                                <Trash2  className="mr-2 h-3.5 w-3.5" /> Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}

                    {products.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={9} className="h-40 text-center">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                                    <Package className="h-8 w-8" />
                                    <p className="text-sm font-semibold uppercase tracking-widest">
                                        Aucun produit
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Footer count */}
            {products.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--glass-border)] bg-muted/5">
                    <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
                        {products.length} produit{products.length > 1 ? 's' : ''}
                        {selectedProducts.size > 0 && (
                            <span className="ml-2 text-primary">
                                · {selectedProducts.size} sélectionné{selectedProducts.size > 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                    <p className="text-[9px] font-semibold text-muted-foreground/30 uppercase tracking-widest">
                        Tri: {sortKey} {sortDir === 'asc' ? '↑' : '↓'}
                    </p>
                </div>
            )}
        </div>
    );
}
