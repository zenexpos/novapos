'use client';

import React, { useState } from 'react';
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
    Copy, ChevronUp, ChevronDown, ChevronsUpDown,
    TrendingUp, TrendingDown, TriangleAlert, CheckCircle2, XCircle,
    History, FileText
} from 'lucide-react';
import {
    cn, formatCurrency, calculateMarginRate
} from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

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
    in_stock:    { Icon: CheckCircle2,  cls: 'text-emerald-600', label: 'Stock' },
    low_stock:   { Icon: TriangleAlert, cls: 'text-amber-600', label: 'Bas' },
    out_of_stock:{ Icon: XCircle,       cls: 'text-red-600', label: 'Rupt.' },
    overstock:   { Icon: CheckCircle2,  cls: 'text-blue-600', label: 'Exc.' },
} as const;

const ProductRow = React.memo(({ 
    product, isSelected, onToggle, onEdit, onDuplicate, onHistory, onDelete, onSelect
}: { 
    product: Product, isSelected: boolean, onToggle: (u: string) => void, onEdit: (p: Product) => void, 
    onDuplicate: (p: Product) => void, onHistory: (p: Product) => void, onDelete: (p: Product) => void, 
    onSelect: (p: Product) => void
}) => {
    const stock = stockCfg[product.stockStatus ?? 'in_stock'];
    const marginRate = calculateMarginRate(product.price, product.purchasePrice);

    return (
        <TableRow
            className={cn(
                'group border-b cursor-pointer h-10',
                isSelected ? 'bg-primary/5' : 'hover:bg-muted/30',
            )}
            onClick={() => onSelect(product)}
        >
            <TableCell className="px-4 py-0" onClick={e => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(product.uuid)}
                    className="h-3.5 w-3.5 border-primary/40 data-[state=checked]:bg-primary"
                />
            </TableCell>

            <TableCell className="px-2 py-0">
                <div className="flex flex-col">
                    <span className="font-bold text-[11px] truncate max-w-[400px] uppercase">
                        {product.name}
                    </span>
                    {product.barcodes?.[0] && <span className="text-[8px] font-mono text-muted-foreground/30">{product.barcodes[0]}</span>}
                </div>
            </TableCell>

            <TableCell className="px-2 py-0">
                <div className={cn("flex items-center gap-1 text-[9px] font-bold uppercase", stock.cls)}>
                    <stock.Icon className="h-2.5 w-2.5" />
                    {stock.label}
                </div>
            </TableCell>

            <TableCell className="px-2 py-0 hidden lg:table-cell">
                <span className="text-[9px] font-bold uppercase text-muted-foreground/40">{product.category || '—'}</span>
            </TableCell>

            <TableCell className="px-2 py-0">
                <span className="font-mono font-bold text-[11px]">{product.quantity} <span className="text-[8px] opacity-30">{product.unit || 'pcs'}</span></span>
            </TableCell>

            <TableCell className="px-2 py-0 text-right">
                <span className="font-mono text-[11px] font-black text-primary">
                    {formatCurrency(product.price)}
                </span>
            </TableCell>

            <TableCell className="px-2 py-0 text-right hidden sm:table-cell">
                <div className={cn('inline-flex items-center gap-0.5 text-[9px] font-black', marginRate >= 20 ? 'text-emerald-600' : 'text-amber-600')}>
                    {marginRate >= 20 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                    {marginRate.toFixed(0)}%
                </div>
            </TableCell>

            <TableCell className="px-4 py-0 text-right" onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                            <MoreHorizontal className="h-3.5 w-3.5 opacity-30" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border-white/5">
                        <DropdownMenuItem onClick={() => onSelect(product)} className="text-xs font-bold p-2"><FileText className="mr-2 h-3.5 w-3.5" /> Détails</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(product)} className="text-xs font-bold p-2"><Edit className="mr-2 h-3.5 w-3.5" /> Éditer</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onHistory(product)} className="text-xs font-bold p-2"><History className="mr-2 h-3.5 w-3.5" /> Historique</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(product)} className="text-xs font-bold p-2"><Copy className="mr-2 h-3.5 w-3.5" /> Copier</DropdownMenuItem>
                        <DropdownMenuSeparator className="opacity-10" />
                        <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive text-xs font-bold p-2"><Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer</DropdownMenuItem>
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
    suppliers
}: ProductTableProps) {
    const [sortKey, setSortKey] = useState<'name' | 'price' | 'qty'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const toggleSort = (key: 'name' | 'price' | 'qty') => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const SortBtn = ({ label, col }: { label: string, col: 'name' | 'price' | 'qty' }) => (
        <button onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:text-foreground transition-colors uppercase tracking-widest text-[9px] font-black">
            {label}
            {sortKey !== col ? <ChevronsUpDown className="h-2.5 w-2.5 opacity-30" /> : sortDir === 'asc' ? <ChevronUp className="h-2.5 w-2.5 text-primary" /> : <ChevronDown className="h-2.5 w-2.5 text-primary" />}
        </button>
    );

    return (
        <div className="rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow className="border-b h-9">
                        <TableHead className="w-10 px-4">
                            <Checkbox
                                checked={products.length > 0 && selectedProducts.size === products.length}
                                onCheckedChange={onToggleSelectAll}
                                className="h-3.5 w-3.5 border-primary/40 data-[state=checked]:bg-primary"
                            />
                        </TableHead>
                        <TableHead><SortBtn label="Désignation" col="name" /></TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">État</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest hidden lg:table-cell">Catégorie</TableHead>
                        <TableHead><SortBtn label="Stock" col="qty" /></TableHead>
                        <TableHead className="text-right"><SortBtn label="Prix" col="price" /></TableHead>
                        <TableHead className="text-right text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest hidden sm:table-cell">Marge</TableHead>
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
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}