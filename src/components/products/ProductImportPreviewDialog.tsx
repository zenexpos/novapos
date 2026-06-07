'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, PackagePlus, PackageCheck, AlertTriangle, CheckCircle, Trash2, Search } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import type { ProductImportAnalysis } from '@/lib/types';

type EditableImportItem = {
    key: string;
    include: boolean;
    status: 'new' | 'update' | 'error';
    data: any;
    originalData: any;
};

interface ProductImportPreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    analysis: ProductImportAnalysis | null;
    onConfirm: (confirmedData: { toAdd: any[], toUpdate: any[] }) => void;
    isImporting: boolean;
}

export function ProductImportPreviewDialog({ isOpen, onOpenChange, analysis, onConfirm, isImporting }: ProductImportPreviewDialogProps) {
    
    const [editableItems, setEditableItems] = useState<EditableImportItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (analysis) {
            const toAdd = analysis.productsToAdd.map((p, i) => ({
                key: `new-${i}`,
                include: true,
                status: 'new' as const,
                data: p,
                originalData: p,
            }));
            const toUpdate = analysis.productsToUpdate.map((p, i) => ({
                key: `update-${i}`,
                include: true,
                status: 'update' as const,
                data: p,
                originalData: p,
            }));
             const inError = analysis.errorRows.map((p, i) => ({
                key: `error-${i}`,
                include: false,
                status: 'error' as const,
                data: p,
                originalData: p,
            }));
            setEditableItems([...toAdd, ...toUpdate, ...inError]);
        }
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [analysis, isOpen]);

    const handleItemChange = (key: string, field: string, value: string | number | null) => {
        setEditableItems(prev => prev.map(item => 
            item.key === key ? { ...item, data: { ...item.data, [field]: value } } : item
        ));
    };

    const handleToggleInclude = (key: string) => {
        setEditableItems(prev => prev.map(item => 
            item.key === key ? { ...item, include: !item.include } : item
        ));
    };
    
    const handleToggleAll = (checked: boolean) => {
        const filteredKeys = new Set(filteredItems.map(i => i.key));
        setEditableItems(prev => prev.map(item => 
            (filteredKeys.has(item.key) && item.status !== 'error') ? { ...item, include: checked } : item
        ));
    };

    const handleRemoveItem = (key: string) => {
        setEditableItems(prev => prev.filter(item => item.key !== key));
    };

    const handleConfirmImport = () => {
        if (!analysis) return;

        const confirmedData = {
            toAdd: editableItems.filter(i => i.include && i.status === 'new').map(i => ({
                ...i.data,
                barcodes: typeof i.data.barcodes === 'string' ? i.data.barcodes.split(',').map((b: string) => b.trim()).filter(Boolean) : (i.data.barcodes || []),
            })),
            toUpdate: editableItems.filter(i => i.include && i.status === 'update').map(i => ({
                ...i.data,
                barcodes: typeof i.data.barcodes === 'string' ? i.data.barcodes.split(',').map((b: string) => b.trim()).filter(Boolean) : (i.data.barcodes || []),
            })),
        };
        onConfirm(confirmedData);
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) {
            return editableItems;
        }
        const lowercasedQuery = searchQuery.toLowerCase().trim();
        return editableItems.filter(item => {
            const { name } = item.data;
            return (name && String(name).toLowerCase().includes(lowercasedQuery));
        });
    }, [editableItems, searchQuery]);

    const stats = useMemo(() => {
        if (!analysis) return { toAdd: 0, toUpdate: 0, skipped: 0, errors: 0 };
        return {
            toAdd: editableItems.filter(i => i.include && i.status === 'new').length,
            toUpdate: editableItems.filter(i => i.include && i.status === 'update').length,
            skipped: editableItems.filter(i => !i.include && i.status !== 'error').length,
            errors: editableItems.filter(i => i.status === 'error').length,
        };
    }, [editableItems, analysis]);

    if (!analysis) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Aperçu de l'importation de produits</DialogTitle>
                    <DialogDescription>
                        Vérifiez, modifiez ou excluez des produits avant de finaliser l'importation. Les lignes en erreur sont exclues par défaut.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 flex-grow flex flex-col min-h-0">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <PackagePlus className="mx-auto h-6 w-6 text-blue-600 dark:text-blue-400" />
                            <p className="text-xl font-bold mt-1">{stats.toAdd}</p>
                            <p className="text-xs text-muted-foreground">Nouveaux produits</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <PackageCheck className="mx-auto h-6 w-6 text-green-600 dark:text-green-400" />
                            <p className="text-xl font-bold mt-1">{stats.toUpdate}</p>
                            <p className="text-xs text-muted-foreground">Produits à M.A.J.</p>
                        </div>
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <CheckCircle className="mx-auto h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            <p className="text-xl font-bold mt-1">{stats.skipped}</p>
                            <p className="text-xs text-muted-foreground">Lignes ignorées</p>
                        </div>
                         <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertTriangle className="mx-auto h-6 w-6 text-red-600 dark:text-red-400" />
                            <p className="text-xl font-bold mt-1">{stats.errors}</p>
                            <p className="text-xs text-muted-foreground">Lignes en erreur</p>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par nom..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full"
                        />
                    </div>

                    <ScrollArea className="border rounded-lg flex-grow">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                                <TableRow>
                                    <TableHead className="w-12"><Checkbox 
                                        checked={filteredItems.length > 0 && filteredItems.filter(i => i.status !== 'error').every(i => i.include)}
                                        onCheckedChange={(checked) => handleToggleAll(!!checked)}
                                    /></TableHead>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead>Prix Vente</TableHead>
                                    <TableHead>Prix Achat</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Stock Min.</TableHead>
                                    <TableHead>Codes-barres</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length > 0 ? filteredItems.map((item) => (
                                    <TableRow key={item.key} className={!item.include ? 'bg-muted/50 text-muted-foreground' : ''}>
                                        <TableCell>
                                            <Checkbox checked={item.include} onCheckedChange={() => handleToggleInclude(item.key)} disabled={item.status === 'error'}/>
                                        </TableCell>
                                        <TableCell>
                                            <Input value={item.data.name || ''} onChange={e => handleItemChange(item.key, 'name', e.target.value)} className="h-8 min-w-[150px]" disabled={!item.include} />
                                        </TableCell>
                                        <TableCell>
                                            <Input value={item.data.category || ''} onChange={e => handleItemChange(item.key, 'category', e.target.value)} className="h-8 min-w-[120px]" disabled={!item.include} />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={item.data.price || ''} onChange={e => handleItemChange(item.key, 'price', e.target.value)} className="h-8" disabled={!item.include} />
                                        </TableCell>
                                         <TableCell>
                                            <Input type="number" value={item.data.purchasePrice || ''} onChange={e => handleItemChange(item.key, 'purchasePrice', e.target.value)} className="h-8" disabled={!item.include} />
                                        </TableCell>
                                         <TableCell>
                                            <Input type="number" value={item.data.quantity || ''} onChange={e => handleItemChange(item.key, 'quantity', e.target.value)} className="h-8" disabled={!item.include} />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={item.data.minStockLevel || ''} onChange={e => handleItemChange(item.key, 'minStockLevel', e.target.value)} className="h-8" disabled={!item.include} />
                                        </TableCell>
                                        <TableCell>
                                            <Input value={Array.isArray(item.data.barcodes) ? item.data.barcodes.join(', ') : item.data.barcodes || ''} onChange={e => handleItemChange(item.key, 'barcodes', e.target.value)} className="h-8 min-w-[150px]" disabled={!item.include} />
                                        </TableCell>
                                        <TableCell>
                                            {item.status === 'new' && <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Nouveau</Badge>}
                                            {item.status === 'update' && <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Mise à jour</Badge>}
                                            {item.status === 'error' && <Badge variant="destructive">{item.data.error || 'Erreur'}</Badge>}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveItem(item.key)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                            {editableItems.length > 0 ? "Aucun produit ne correspond à votre recherche." : "Aucune donnée à importer."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                        Annuler
                    </Button>
                    <Button onClick={handleConfirmImport} disabled={isImporting || editableItems.filter(i => i.include).length === 0}>
                        {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isImporting ? 'Importation...' : `Confirmer et Importer ${stats.toAdd + stats.toUpdate} produit(s)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
