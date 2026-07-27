'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
    MoreHorizontal, Edit, Trash2,
    Copy, History, ChevronUp, ChevronDown, ChevronsUpDown,
    TrendingUp, TrendingDown, TriangleAlert, CheckCircle2, XCircle, Barcode,
    Tag
} from 'lucide-react';
import {
    cn, formatCurrency, formatPercent, calculateMarginRate, safeToDate, safeNumber, roundFinancial, roundQty
} from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { productService } from '@/services/product.service';
import { toast } from 'sonner';
import { Input } from '../ui/input';

interface ProductTableProps {
    products: Product[];
    onEdit:      (p: Product) => void;
    onDuplicate: (p: Product) => void;
    onHistory:   (p: Product) => void;
    onDelete:    (p: Product) => void;
    onSelect:    (p: Product) => void;
    selectedProducts: Set<string>;
    onToggleProductSelection: (uuid: string) => void;
    onToggleSelectAll: () => void;
    suppliers: Supplier[];
}

const stockCfg = {
    in_stock:    { Icon: CheckCircle2,  cls: 'text-emerald-500 bg-emerald-500/5', label: 'Stock' },
    low_stock:   { Icon: TriangleAlert, cls: 'text-amber-500 bg-amber-500/5', label: 'Bas' },
    out_of_stock:{ Icon: XCircle,       cls: 'text-red-500 bg-red-500/5', label: 'Rupt.' },
    overstock:   { Icon: CheckCircle2,  cls: 'text-blue-500 bg-blue-500/5', label: 'Exc.' },
} as const;

const ProductRow = React.memo(({ 
    product, isSelected, onToggle, onEdit, onDuplicate, onHistory, onDelete, onSelect, onQuickEdit 
}: { 
    product: Product, isSelected: boolean, onToggle: (u: string) => void, onEdit: (p: Product) => void, 
    onDuplicate: (p: Product) => void, onHistory: (p: Product) => void, onDelete: (p: Product) => void, 
    onSelect: (p: Product) => void, onQuickEdit: (u: string, f: string, v: any) => void 
}) => {
    const [editingField, setEditingField] = useState<string | null>(null);
    const stock = stockCfg[product.stockStatus ?? 'in_stock'];
    const marginRate = calculateMarginRate(product.price, product.purchasePrice);

    return (
        <TableRow
            className={cn(
                'group border-b border-white/5 cursor-pointer h-12',
                isSelected ? 'bg-primary/5' : 'hover:bg-white/5',
            )}
            onClick={() => onSelect(product)}
        >
            <TableCell className="px-4" onClick={e => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(product.uuid)}
                    className="h-4 w-4 border-primary/40 data-[state=checked]:bg-primary"
                />
            </TableCell>

            <TableCell className="px-2 py-0">
                <div className="flex flex-col">
                    <span className="font-black text-[12px] truncate max-w-[300px] uppercase">
                        {product.name}
                    </span>
                    <span className="text-[8px] font-mono text-muted-foreground/20">{product.barcodes?.[0] || '—'}</span>
                </div>
            </TableCell>

            <TableCell className="px-2 py-0">
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase', stock.cls)}>
                    <stock.Icon className="h-2.5 w-2.5" />
                    {stock.label}
                </span>
            </TableCell>

            <TableCell className="px-2 py-0 hidden lg:table-cell">
                <span className="text-[9px] font-bold uppercase text-muted-foreground/40">{product.category || 'Général'}</span>
            </TableCell>

            <TableCell className="px-2 py-0" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs tabular-nums">{product.quantity}</span>
                    <span className="text-[8px] font-bold text-muted-foreground/20 uppercase">{product.unit || 'pcs'}</span>
                </div>
            </TableCell>

            <TableCell className="px-2 py-0 text-right">
                <span className="font-mono text-[11px] font-black text-primary tabular-nums">
                    {formatCurrency(product.price)}
                </span>
            </TableCell>

            <TableCell className="px-2 py-0 text-right hidden sm:table-cell">
                <span className={cn('text-[10px] font-black tabular-nums', marginRate >= 20 ? 'text-emerald-500' : 'text-amber-500')}>
                    {marginRate.toFixed(0)}%
                </span>
            </TableCell>

            <TableCell className="px-4 py-0 text-right" onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onEdit(product)} className="text-xs font-bold uppercase"><Edit className="mr-2 h-3.5 w-3.5" /> Éditer</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(product)} className="text-xs font-bold uppercase"><Copy className="mr-2 h-3.5 w-3.5" /> Copier</DropdownMenuItem>
                        <DropdownMenuSeparator className="opacity-10" />
                        <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive text-xs font-bold uppercase"><Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
});
ProductRow.displayName = 'ProductRow';

export function ProductTable({
    products, onEdit, onDuplicate, onHistory, onDelete, onSelect,
    selectedProducts, onToggleProductSelection, onToggleSelectAll,
}: ProductTableProps) {
    return (
        <div className="rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-b border-white/5 h-10">
                        <TableHead className="w-10 px-4">
                            <Checkbox
                                checked={products.length > 0 && selectedProducts.size === products.length}
                                onCheckedChange={onToggleSelectAll}
                                className="h-4 w-4 border-primary/40 data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Désignation</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">État</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 hidden lg:table-cell">Catégorie</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Stock</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">Prix Vente</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 text-right hidden sm:table-cell">Marge</TableHead>
                        <TableHead className="w-10 px-4" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <ProductRow 
                            key={product.uuid} 
                            product={product} 
                            isSelected={selectedProducts.has(product.uuid)}
                            onToggle={onToggleProductSelection}
                            onEdit={onEdit}
                            onDuplicate={onDuplicate}
                            onHistory={onHistory}
                            onDelete={onDelete}
                            onSelect={onSelect}
                            onQuickEdit={() => {}}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
