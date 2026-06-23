'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    MoreHorizontal, Edit, Trash2, Package,
    Copy, History, ChevronUp, ChevronDown, ChevronsUpDown,
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle, Barcode,
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

type SortKey  = 'name' | 'quantity' | 'price' | 'purchasePrice' | 'margin' | 'updatedAt' | 'stockStatus';
type SortDir  = 'asc' | 'desc';

const stockCfg = {
    in_stock:    { Icon: CheckCircle2,  cls: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'En stock'   },
    low_stock:   { Icon: AlertTriangle, cls: 'text-amber-500  bg-amber-500/10  border-amber-500/20',  label: 'Stock bas'  },
    out_of_stock:{ Icon: XCircle,       cls: 'text-red-500    bg-red-500/10    border-red-500/20',    label: 'Rupture'    },
    overstock:   { Icon: Package,       cls: 'text-blue-500   bg-blue-500/10   border-blue-500/20',   label: 'Excédent'   },
} as const;

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
    if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc'
        ? <ChevronUp   className="h-3 w-3 text-primary" />
        : <ChevronDown className="h-3 w-3 text-primary" />;
}

export function ProductTable({
    products, onEdit, onDuplicate, onHistory, onDelete, onSelect,
    selectedProducts, onToggleProductSelection, onToggleSelectAll,
    suppliers,
}: ProductTableProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [sortKey, setSortKey]     = useState<SortKey>('updatedAt');
    const [sortDir, setSortDir]     = useState<SortDir>('desc');
    const [editingCell, setEditingCell] = useState<{ uuid: string, field: string } | null>(null);

    useEffect(() => { setIsMounted(true); }, []);

    const toggleSort = (key: SortKey) => {
        if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const handleQuickEdit = useCallback(async (uuid: string, field: string, value: any) => {
        try {
            const finalValue = field === 'price' || field === 'purchasePrice' 
                ? roundFinancial(safeNumber(value)) 
                : roundQty(safeNumber(value));

            await productService.updateProduct(uuid, { [field]: finalValue });
            setEditingCell(null);
            toast.success("Mise à jour effectuée");
        } catch (e) {
            toast.error("Erreur de mise à jour");
        }
    }, []);

    const sorted = useMemo(() => {
        return [...products].sort((a: any, b: any) => {
            let va: any = 0;
            let vb: any = 0;
            
            if (sortKey === 'name') { va = a.name; vb = b.name; }
            else if (sortKey === 'quantity') { va = a.quantity; vb = b.quantity; }
            else if (sortKey === 'price') { va = a.price; vb = b.price; }
            else if (sortKey === 'purchasePrice') { va = a.purchasePrice; vb = b.purchasePrice; }
            else if (sortKey === 'margin') {
                va = calculateMarginRate(a.price, a.purchasePrice);
                vb = calculateMarginRate(b.price, b.purchasePrice);
            }
            else if (sortKey === 'updatedAt') {
                va = safeToDate(a.updatedAt).getTime();
                vb = safeToDate(b.updatedAt).getTime();
            }
            else if (sortKey === 'stockStatus') {
                va = a.stockStatus; vb = b.stockStatus;
            }

            if (typeof va === 'string')
                return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
        });
    }, [products, sortKey, sortDir]);

    const allSelected = products.length > 0 && selectedProducts.size === products.length;

    const thCls = 'px-3 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap';
    const thBtn = 'flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors';

    return (
        <div className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                        <TableHead className="w-12 px-6">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={onToggleSelectAll}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                        </TableHead>

                        <TableHead className={thCls}>
                            <button className={thBtn} onClick={() => toggleSort('name')}>
                                Désignation <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className={thCls}>
                            <button className={thBtn} onClick={() => toggleSort('stockStatus')}>
                                État <SortIcon col="stockStatus" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className={cn(thCls, 'hidden lg:table-cell')}>Catégorie</TableHead>

                        <TableHead className={thCls}>
                            <button className={thBtn} onClick={() => toggleSort('quantity')}>
                                Stock <SortIcon col="quantity" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className={cn(thCls, 'text-right hidden md:table-cell')}>
                            <button className={cn(thBtn, 'ml-auto')} onClick={() => toggleSort('purchasePrice')}>
                                PMP <SortIcon col="purchasePrice" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className={cn(thCls, 'text-right')}>
                            <button className={cn(thBtn, 'ml-auto')} onClick={() => toggleSort('price')}>
                                Prix Vente <SortIcon col="price" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className={cn(thCls, 'text-right hidden sm:table-cell')}>
                            <button className={cn(thBtn, 'ml-auto')} onClick={() => toggleSort('margin')}>
                                Marge <SortIcon col="margin" sortKey={sortKey} sortDir={sortDir} />
                            </button>
                        </TableHead>

                        <TableHead className="w-10 px-6" />
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {sorted.map((product) => {
                        const isSelected = selectedProducts.has(product.uuid);
                        const stock      = stockCfg[product.stockStatus ?? 'in_stock'];
                        const marginRate = calculateMarginRate(product.price, product.purchasePrice);
                        const isGoodMargin = marginRate >= 20;

                        return (
                            <TableRow
                                key={product.uuid}
                                className={cn(
                                    'group border-b border-white/5 cursor-pointer transition-all duration-150',
                                    isSelected ? 'bg-primary/10' : 'hover:bg-white/5',
                                )}
                                onClick={() => onSelect(product)}
                            >
                                <TableCell className="px-6" onClick={e => e.stopPropagation()}>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => onToggleProductSelection(product.uuid)}
                                        className="border-primary data-[state=checked]:bg-primary"
                                    />
                                </TableCell>

                                <TableCell className="px-3 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-black text-sm leading-tight group-hover:text-primary transition-colors truncate max-w-[250px]">
                                            {product.name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            {product.barcodes?.[0] && (
                                                <span className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground/40 bg-black/20 px-1.5 py-0.5 rounded border border-white/5">
                                                    <Barcode className="h-2 w-2" /> {product.barcodes[0]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="px-3 py-4">
                                    <span className={cn(
                                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide border shadow-sm',
                                        stock.cls,
                                    )}>
                                        <stock.Icon className="h-2.5 w-2.5" />
                                        {stock.label}
                                    </span>
                                </TableCell>

                                <TableCell className="px-3 py-4 hidden lg:table-cell">
                                    <Badge variant="outline" className="gap-1.5 px-3 py-1 rounded-xl border-white/10 bg-muted/20 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                                        <Tag className="h-2.5 w-2.5 opacity-40" /> {product.category || 'Général'}
                                    </Badge>
                                </TableCell>

                                <TableCell className="px-3 py-4" onClick={e => e.stopPropagation()}>
                                    {editingCell?.uuid === product.uuid && editingCell?.field === 'quantity' ? (
                                        <Input 
                                            type="number" 
                                            defaultValue={product.quantity} 
                                            className="w-20 h-8 font-black"
                                            autoFocus
                                            onBlur={(e) => handleQuickEdit(product.uuid, 'quantity', e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleQuickEdit(product.uuid, 'quantity', (e.target as any).value)}
                                        />
                                    ) : (
                                        <div 
                                            className="flex items-center gap-3 hover:bg-muted/50 p-1 rounded-lg transition-all"
                                            onClick={() => setEditingCell({ uuid: product.uuid, field: 'quantity' })}
                                        >
                                            <div className={cn(
                                                "h-8 w-10 rounded-lg flex items-center justify-center font-mono font-black text-xs shadow-inner",
                                                product.stockStatus === 'out_of_stock' ? "bg-red-500/10 text-red-500" : "bg-black/20"
                                            )}>
                                                {product.quantity}
                                            </div>
                                            <span className="text-[8px] font-black uppercase text-muted-foreground/20">{product.unit ?? 'PCS'}</span>
                                        </div>
                                    )}
                                </TableCell>

                                <TableCell className="px-3 py-4 text-right hidden md:table-cell">
                                    <span className="font-mono text-xs font-bold text-muted-foreground/50 tabular-nums">
                                        {formatCurrency(product.purchasePrice)}
                                    </span>
                                </TableCell>

                                <TableCell className="px-3 py-4 text-right" onClick={e => e.stopPropagation()}>
                                    {editingCell?.uuid === product.uuid && editingCell?.field === 'price' ? (
                                        <Input 
                                            type="number" 
                                            defaultValue={product.price} 
                                            className="w-24 h-8 text-right font-black text-primary"
                                            autoFocus
                                            onBlur={(e) => handleQuickEdit(product.uuid, 'price', e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleQuickEdit(product.uuid, 'price', (e.target as any).value)}
                                        />
                                    ) : (
                                        <span 
                                            className="font-mono text-base font-black text-primary tabular-nums tracking-tighter hover:bg-muted/50 p-1 rounded-lg transition-all"
                                            onClick={() => setEditingCell({ uuid: product.uuid, field: 'price' })}
                                        >
                                            {formatCurrency(product.price)}
                                        </span>
                                    )}
                                </TableCell>

                                <TableCell className="px-3 py-4 text-right hidden sm:table-cell">
                                    <div className={cn(
                                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-[11px] shadow-sm',
                                        isGoodMargin
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                                    )}>
                                        {isGoodMargin ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {formatPercent(marginRate)}
                                    </div>
                                </TableCell>

                                <TableCell className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-all">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-sm bg-card min-w-[200px] p-2">
                                            <DropdownMenuItem onClick={() => onEdit(product)} className="rounded-xl p-3">
                                                <Edit className="mr-3 h-4 w-4" /> Modifier Fiche
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDuplicate(product)} className="rounded-xl p-3">
                                                <Copy className="mr-3 h-4 w-4" /> Dupliquer Article
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onHistory(product)} className="rounded-xl p-3">
                                                <History className="mr-3 h-4 w-4" /> Historique Flux
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="opacity-10" />
                                            <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive rounded-xl p-3">
                                                <Trash2 className="mr-3 h-4 w-4" /> Révoquer Item
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
