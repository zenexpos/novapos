'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
    Database, 
    CheckCircle2, 
    X, 
    Package, 
    Users2, 
    Archive, 
    Coins, 
    Search,
    Save,
    Trash2,
    Loader2,
    Eye,
    RotateCcw,
    Link as LinkIcon,
    ChevronDown,
    History,
    HandCoins,
    Undo2,
    Wheat,
    Building
} from 'lucide-react';
import { backupService } from '@/services/backup.service';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { v4 as uuidv4 } from 'uuid';

interface BackupPreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: Record<string, any[]>;
}

type Category = 'products' | 'customers' | 'suppliers' | 'expenses' | 'sales' | 'inventory_logs' | 'payments' | 'bread_orders' | 'company_profile' | 'stock_intakes' | 'product_returns' | 'supplier_payments' | 'proforma_invoices';

const APP_FIELDS: Record<string, { label: string, key: string }[]> = {
    products: [
        { label: 'Désignation', key: 'name' },
        { label: 'Catégorie', key: 'category' },
        { label: 'Prix Vente', key: 'price' },
        { label: 'Prix Achat', key: 'purchasePrice' },
        { label: 'Stock', key: 'quantity' },
        { label: 'Stock Min', key: 'minStockLevel' },
        { label: 'Unité', key: 'unite' },
        { label: 'Expiration', key: 'dateExpiration' },
    ],
    customers: [
        { label: 'Prénom', key: 'firstName' },
        { label: 'Nom', key: 'lastName' },
        { label: 'Téléphone', key: 'phone' },
        { label: 'Adresse', key: 'address' },
        { label: 'Jour Règlement', key: 'settlementDay' },
        { label: 'Limite Crédit', key: 'creditLimit' },
        { label: 'Solde Initial', key: 'initialBalance' },
        { label: 'Total Dépensé', key: 'totalSpent' },
        { label: 'Solde Restant', key: 'outstandingBalance' },
        { label: 'Statut Dette', key: 'debtStatus' },
        { label: 'Client Pain', key: 'isBreadClient' },
        { label: 'Récurrence Pain', key: 'bread_type_recurrence' },
        { label: 'Notes', key: 'notes' },
        { label: 'Créé le', key: 'createdAt' },
        { label: 'Mis à jour', key: 'updatedAt' },
    ],
    suppliers: [
        { label: 'Nom', key: 'name' },
        { label: 'Contact', key: 'contactPerson' },
        { label: 'Téléphone', key: 'phone' },
        { label: 'Email', key: 'email' },
        { label: 'Solde', key: 'balance' },
        { label: 'Adresse', key: 'address' },
        { label: 'Notes', key: 'notes' },
        { label: 'Créé le', key: 'createdAt' },
        { label: 'Mis à jour', key: 'updatedAt' },
    ],
    expenses: [
        { label: 'Description', key: 'description' },
        { label: 'Poste', key: 'category' },
        { label: 'Montant', key: 'amount' },
        { label: 'Date', key: 'expenseDate' },
        { label: 'Méthode', key: 'paymentMethod' },
        { label: 'Notes', key: 'notes' },
        { label: 'Créé le', key: 'createdAt' },
        { label: 'Mis à jour', key: 'updatedAt' },
    ],
    sales: [
        { label: 'N° Facture', key: 'invoiceNumber' },
        { label: 'Articles', key: 'items' },
        { label: 'Sous-total', key: 'subtotal' },
        { label: 'Type Remise', key: 'discountType' },
        { label: 'Remise', key: 'discountAmount' },
        { label: 'Total', key: 'total' },
        { label: 'Reçu', key: 'amountPaid' },
        { label: 'Solde Restant', key: 'remainingBalance' },
        { label: 'Statut', key: 'paymentStatus' },
        { label: 'Méthode', key: 'paymentMethod' },
        { label: 'Client', key: 'customerUuid' },
        { label: 'Date Échéance', key: 'dueDate' },
        { label: 'Annulé', key: 'isCancelled' },
        { label: 'Annulé le', key: 'cancelledAt' },
        { label: 'Motif Annulation', key: 'cancellationNote' },
        { label: 'Notes', key: 'notes' },
        { label: 'Créé le', key: 'createdAt' },
        { label: 'Mis à jour', key: 'updatedAt' },
    ],
    stock_intakes: [
        { label: 'N° Facture', key: 'invoiceNumber' },
        { label: 'Articles', key: 'items' },
        { label: 'Date', key: 'invoiceDate' },
        { label: 'Transport', key: 'shippingCost' },
        { label: 'Total', key: 'totalValue' },
        { label: 'Notes', key: 'notes' },
        { label: 'Créé le', key: 'createdAt' },
        { label: 'Mis à jour', key: 'updatedAt' },
    ],
    payments: [
        { label: 'Montant', key: 'amount' },
        { label: 'Date', key: 'paymentDate' },
        { label: 'Méthode', key: 'method' },
        { label: 'Notes', key: 'notes' },
        { label: 'Créé le', key: 'createdAt' },
        { label: 'Mis à jour', key: 'updatedAt' },
    ],
    supplier_payments: [
        { label: 'Fournisseur', key: 'supplierUuid' },
        { label: 'Montant', key: 'amount' },
        { label: 'Date', key: 'paymentDate' },
        { label: 'Méthode', key: 'method' },
        { label: 'Notes', key: 'notes' },
        { label: 'Créé le', key: 'createdAt' },
        { label: 'Mis à jour', key: 'updatedAt' },
    ],
    inventory_logs: [
        { label: 'Produit', key: 'productUuid' },
        { label: 'Variation', key: 'change' },
        { label: 'Quantité', key: 'newQuantity' },
        { label: 'Motif', key: 'reason' },
        { label: 'Document', key: 'relatedUuid' },
        { label: 'Notes', key: 'notes' },
        { label: 'Créé le', key: 'createdAt' },
        { label: 'Mis à jour', key: 'updatedAt' },
    ],
    proforma_invoices: [
        { label: 'N° Proforma', key: 'proformaNumber' },
        { label: 'Articles', key: 'items' },
        { label: 'Sous-total', key: 'subtotal' },
        { label: 'Type Remise', key: 'discountType' },
        { label: 'Remise', key: 'discountAmount' },
        { label: 'Total', key: 'total' },
        { label: 'Client', key: 'customerUuid' },
        { label: 'Statut', key: 'status' },
        { label: 'Valide Jusqu’au', key: 'validUntil' },
        { label: 'Notes', key: 'notes' },
        { label: 'Créé le', key: 'createdAt' },
        { label: 'Mis à jour', key: 'updatedAt' },
    ],
    product_returns: [
        { label: 'N° Facture Origine', key: 'originalInvoiceNumber' },
        { label: 'Articles', key: 'items' },
        { label: 'Valeur Retour', key: 'totalReturnValue' },
        { label: 'Remboursé', key: 'amountRefunded' },
        { label: 'Méthode de Remboursement', key: 'refundMethod' },
        { label: 'Client', key: 'customerUuid' },
        { label: 'Notes', key: 'notes' },
        { label: 'Créé le', key: 'createdAt' },
        { label: 'Mis à jour', key: 'updatedAt' },
    ],
};

const NUMERIC_FIELDS = [
    'price', 'purchasePrice', 'quantity', 'minStockLevel', 
    'settlementDay', 'creditLimit', 'initialBalance', 'totalSpent', 'outstandingBalance', 
    'balance', 'amount', 'subtotal', 'discountAmount', 'total', 'amountPaid', 'remainingBalance', 
    'shippingCost', 'totalValue', 'totalReturnValue', 'amountRefunded', 'quantite'
];

export function BackupPreviewDialog({ isOpen, onOpenChange, initialData }: BackupPreviewDialogProps) {
    const [data, setData] = useState<Record<string, any[]>>(initialData);
    const [activeCategory, setActiveCategory] = useState<Category>('products');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);

    const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
    const [selectedColumns, setSelectedColumns] = useState<Record<string, Set<string>>>({});
    const [columnMapping, setColumnMapping] = useState<Record<string, Record<string, string>>>({});

    useEffect(() => {
        if (isOpen && initialData) {
            const sanitizedData: Record<string, any[]> = {};
            const tables = new Set<string>();
            const cols: Record<string, Set<string>> = {};
            const mappings: Record<string, Record<string, string>> = {};
            
            const knownTables = new Set(db.tables.map(t => t.name));

            Object.keys(initialData).forEach(tableId => {
                if (!knownTables.has(tableId)) return;

                let tableContent = initialData[tableId];
                
                if (tableContent && !Array.isArray(tableContent)) {
                    tableContent = [tableContent];
                }
                
                if (tableContent && Array.isArray(tableContent)) {
                    sanitizedData[tableId] = tableContent;
                    tables.add(tableId);
                    const sourceCols = tableContent.length > 0 ? Object.keys(tableContent[0]) : [];
                    cols[tableId] = new Set(sourceCols.filter(k => k !== 'id' && k !== 'uuid' && k !== '_removed'));
                    
                    mappings[tableId] = {};
                    const appProps = APP_FIELDS[tableId] || [];
                    
                    sourceCols.forEach(sCol => {
                        const match = appProps.find(p => 
                            p.key.toLowerCase() === sCol.toLowerCase() || 
                            p.label.toLowerCase() === sCol.toLowerCase() ||
                            (sCol.toLowerCase() === 'sellingprice' && p.key === 'price') ||
                            (sCol.toLowerCase() === 'purchaseprice' && p.key === 'purchasePrice') ||
                            (sCol.toLowerCase() === 'solde' && p.key === 'initialBalance') ||
                            (sCol.toLowerCase() === 'dette' && p.key === 'initialBalance') ||
                            (sCol.toLowerCase() === 'debt' && p.key === 'initialBalance') ||
                            (sCol.toLowerCase() === 'r_solde' && p.key === 'initialBalance') ||
                            (sCol.toLowerCase() === 'outstandingbalance' && p.key === 'initialBalance')
                        );
                        if (match) mappings[tableId][sCol] = match.key;
                    });
                }
            });
            
            setData(sanitizedData);
            setSelectedTables(tables);
            setSelectedColumns(cols);
            setColumnMapping(mappings);
        }
    }, [initialData, isOpen]);

    const categories = [
        { id: 'products', label: 'Catalogue', icon: Package, count: data.products?.length || 0 },
        { id: 'customers', label: 'Clients', icon: Users2, count: data.customers?.length || 0 },
        { id: 'suppliers', label: 'Partenaires', icon: Building, count: data.suppliers?.length || 0 },
        { id: 'supplier_payments', label: 'Paiements Partenaires', icon: HandCoins, count: data.supplier_payments?.length || 0 },
        { id: 'stock_intakes', label: 'Réceptions', icon: Archive, count: data.stock_intakes?.length || 0 },
        { id: 'sales', label: 'Ventes', icon: History, count: data.sales?.length || 0 },
        { id: 'payments', label: 'Paiements Clients', icon: Coins, count: data.payments?.length || 0 },
        { id: 'expenses', label: 'Charges', icon: Coins, count: data.expenses?.length || 0 },
        { id: 'inventory_logs', label: 'Journal Stock', icon: Package, count: data.inventory_logs?.length || 0 },
        { id: 'product_returns', label: 'Retours', icon: Undo2, count: data.product_returns?.length || 0 },
        { id: 'bread_orders', label: 'Pain', icon: Wheat, count: data.bread_orders?.length || 0 },
        { id: 'proforma_invoices', label: 'Proformas', icon: History, count: data.proforma_invoices?.length || 0 },
        { id: 'company_profile', label: 'Identité', icon: Database, count: data.company_profile?.length || 0 },
    ].filter(cat => cat.id in data);

    const toggleTable = (tableId: string) => {
        const next = new Set(selectedTables);
        if (next.has(tableId)) next.delete(tableId);
        else next.add(tableId);
        setSelectedTables(next);
    };

    const toggleColumn = (tableId: string, column: string) => {
        const nextCols = new Set(selectedColumns[tableId] || []);
        if (nextCols.has(column)) nextCols.delete(column);
        else nextCols.add(column);
        setSelectedColumns(prev => ({ ...prev, [tableId]: nextCols }));
    };

    const handleUpdateMapping = (sourceCol: string, appKey: string) => {
        setColumnMapping(prev => ({
            ...prev,
            [activeCategory]: {
                ...(prev[activeCategory] || {}),
                [sourceCol]: appKey
            }
        }));
    };

    const handleUpdateField = useCallback((category: string, index: number, field: string, value: any) => {
        setData(prev => {
            const newData = { ...prev };
            const table = [...(newData[category] || [])];
            if (table[index]) {
                table[index] = { ...table[index], [field]: value };
                newData[category] = table;
            }
            return { ...newData };
        });
    }, []);

    const filteredData = useMemo(() => {
        const table = data[activeCategory] || [];
        if (!searchQuery.trim()) return table;
        const q = searchQuery.toLowerCase();
        return table.filter((item: any) => {
            const text = JSON.stringify(item).toLowerCase();
            return text.includes(q);
        });
    }, [data, activeCategory, searchQuery]);

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            const finalManifest: Record<string, any[]> = {};
            
            selectedTables.forEach(tableId => {
                const tableData = data[tableId];
                if (!tableData || !Array.isArray(tableData)) return;

                const tableCols = selectedColumns[tableId];
                const mappings = columnMapping[tableId] || {};
                
                if (!tableCols) return;

                finalManifest[tableId] = tableData
                    .filter((record: any) => !record._removed)
                    .map(record => {
                        const transformed: any = { uuid: record.uuid || uuidv4() }; 
                        
                        Object.keys(record).forEach(sourceKey => {
                            if (tableCols.has(sourceKey) && sourceKey !== 'uuid' && sourceKey !== 'id' && sourceKey !== '_removed') {
                                const targetKey = mappings[sourceKey] || sourceKey;
                                let value = record[sourceKey];

                                // ENFORCEMENT: Proper numeric conversion
                                if (NUMERIC_FIELDS.includes(targetKey)) {
                                    value = parseFloat(value) || 0;
                                }

                                if (targetKey.toLowerCase().includes('date') && typeof value === 'string' && value) {
                                    const d = new Date(value);
                                    if (!isNaN(d.getTime())) value = d;
                                }

                                transformed[targetKey] = value;
                            }
                        });
                        
                        return transformed;
                    });
            });

            await backupService.restoreBackup(finalManifest);
            toast.success("Restauration Elite terminée.");
            onOpenChange(false);
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error("Échec de l'injection", { description: error.message });
        } finally {
            setIsRestoring(false);
        }
    };

    const availableCols = data[activeCategory]?.length > 0 
        ? Object.keys(data[activeCategory][0]).filter(k => k !== 'id' && k !== 'uuid' && k !== '_removed') 
        : [];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-sm rounded-lg bg-card">
                <DialogHeader className="bg-primary/5 p-4 border-b border-primary/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                <Database className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold tracking-tighter">Déploiement Sélectif & Mapping</DialogTitle>
                                <DialogDescription className="text-[10px] font-semibold uppercase text-primary/50">Liez les colonnes de votre fichier aux champs de l'application</DialogDescription>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-12 px-6 font-semibold text-xs uppercase tracking-wide" disabled={isRestoring}>
                                Annuler
                            </Button>
                            <Button type="button" onClick={handleRestore} disabled={isRestoring || selectedTables.size === 0} className="flex-1 sm:flex-none h-12 px-4 rounded-2xl font-semibold text-xs uppercase tracking-wide shadow-xl shadow-sm gap-3">
                                {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Valider & Injecter
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-full lg:w-80 bg-muted/20 border-r border-white/5 p-6 space-y-2 shrink-0 overflow-y-auto custom-scrollbar">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground/40 mb-6 px-4">Segments du Manifeste</p>
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-2 group">
                                <Checkbox 
                                    checked={selectedTables.has(cat.id)} 
                                    onCheckedChange={() => toggleTable(cat.id)}
                                    className="h-5 w-5 border-primary data-[state=checked]:bg-primary rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => setActiveCategory(cat.id as Category)}
                                    className={cn(
                                        "flex-grow flex items-center justify-between p-4 rounded-2xl text-[10px] font-semibold uppercase tracking-wide transition-all duration-500",
                                        activeCategory === cat.id 
                                            ? "bg-primary text-primary-foreground shadow-xl shadow-sm scale-[1.02]" 
                                            : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <cat.icon className="h-4 w-4" />
                                        <span>{cat.label}</span>
                                    </div>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-lg font-mono",
                                        activeCategory === cat.id ? "bg-white/20" : "bg-black/20"
                                    )}>{cat.count}</span>
                                </button>
                            </div>
                        ))}

                        {availableCols.length > 0 && (
                            <div className="mt-10 p-6 bg-primary/5 rounded-lg border border-dashed border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center gap-2 text-primary mb-4">
                                    <Eye className="h-4 w-4" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wide">Surveillance Colonnes</span>
                                </div>
                                <div className="space-y-3">
                                    {availableCols.map(col => (
                                        <div key={col} className="flex items-center gap-3 group/col">
                                            <Checkbox 
                                                id={`col-${col}`}
                                                checked={selectedColumns[activeCategory]?.has(col)}
                                                onCheckedChange={() => toggleColumn(activeCategory, col)}
                                                className="h-4 w-4 border-primary/40 data-[state=checked]:bg-primary"
                                            />
                                            <label htmlFor={`col-${col}`} className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/60 group-hover/col:text-primary transition-colors cursor-pointer truncate">
                                                {col}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Data Editor & Mapper */}
                    <div className="flex-grow flex flex-col min-w-0 bg-black/20">
                        <div className="p-6 border-b border-white/5 bg-card/20 flex gap-4">
                            <div className="relative flex-grow max-w-xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-30" />
                                <Input 
                                    placeholder="Rechercher dans ce segment..."
                                    className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <ScrollArea className="flex-grow">
                            <div className="p-4">
                                {!selectedTables.has(activeCategory) ? (
                                    <div className="h-full py-40 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                                        <X className="h-9 w-16" />
                                        <p className="text-[10px] font-semibold uppercase ">Segment exclu</p>
                                    </div>
                                ) : filteredData.length === 0 ? (
                                    <div className="h-full py-40 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                                        <X className="h-9 w-16" />
                                        <p className="text-[10px] font-semibold uppercase ">Aucune donnée</p>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-white/5 bg-black/40 overflow-hidden shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow className="border-white/5">
                                                    {availableCols.map(col => {
                                                        const isExcluded = !selectedColumns[activeCategory]?.has(col);
                                                        const mappedKey = columnMapping[activeCategory]?.[col];
                                                        const appProp = APP_FIELDS[activeCategory]?.find(p => p.key === mappedKey);

                                                        return (
                                                            <TableHead key={col} className={cn(
                                                                "min-w-[180px] p-0 border-r border-white/5 last:border-r-0 transition-opacity",
                                                                isExcluded && "opacity-20"
                                                            )}>
                                                                <div className="flex flex-col">
                                                                    <div className="p-4 bg-muted/20 font-mono text-[10px] font-semibold text-muted-foreground/60 uppercase truncate">
                                                                        {col}
                                                                    </div>
                                                                    <div className="p-2 bg-black/20">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <button className={cn(
                                                                                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[9px] font-semibold uppercase tracking-wide transition-all",
                                                                                    mappedKey ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted/20 text-muted-foreground/40"
                                                                                )}>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <LinkIcon className="h-3 w-3" />
                                                                                        {appProp?.label || 'Lier champ...'}
                                                                                    </div>
                                                                                    <ChevronDown className="h-3 w-3 opacity-30" />
                                                                                </button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent className="w-56 rounded-2xl border-white/5 bg-card/95 backdrop-blur-sm shadow-sm">
                                                                                <DropdownMenuLabel className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground p-3">Destination App</DropdownMenuLabel>
                                                                                <DropdownMenuSeparator className="opacity-10" />
                                                                                <DropdownMenuRadioGroup value={mappedKey} onValueChange={(val) => handleUpdateMapping(col, val)}>
                                                                                    {APP_FIELDS[activeCategory]?.map(p => (
                                                                                        <DropdownMenuRadioItem key={p.key} value={p.key} className="text-[10px] font-bold p-3 rounded-xl cursor-pointer">
                                                                                            {p.label} <span className="ml-2 opacity-20 font-mono">({p.key})</span>
                                                                                        </DropdownMenuRadioItem>
                                                                                    ))}
                                                                                    <DropdownMenuRadioItem value="" className="text-[10px] font-bold p-3 rounded-xl text-destructive">
                                                                                        Délier
                                                                                    </DropdownMenuRadioItem>
                                                                                </DropdownMenuRadioGroup>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </div>
                                                            </TableHead>
                                                        )
                                                    })}
                                                    <TableHead className="w-12 bg-muted/20"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredData.map((item: any, idx: number) => (
                                                    <TableRow key={item.uuid || idx} className={cn(
                                                        "border-white/5 group hover:bg-white/5 transition-all",
                                                        item._removed && "opacity-30 grayscale line-through"
                                                    )}>
                                                        {availableCols.map(col => (
                                                            <TableCell key={col} className={cn(
                                                                "p-2 border-r border-white/5 last:border-r-0 transition-opacity",
                                                                !selectedColumns[activeCategory]?.has(col) && "opacity-20 grayscale pointer-events-none"
                                                            )}>
                                                                <Input 
                                                                    value={item[col] ?? ''} 
                                                                    onChange={e => handleUpdateField(activeCategory, idx, col, e.target.value)} 
                                                                    className="h-9 bg-transparent border-none focus-visible:ring-primary font-medium text-xs shadow-none p-2 min-w-[120px]" 
                                                                    disabled={item._removed}
                                                                />
                                                            </TableCell>
                                                        ))}
                                                        <TableCell className="p-2">
                                                            <Button 
                                                                type="button"
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => handleUpdateField(activeCategory, idx, '_removed', !item._removed)} 
                                                                className={cn(
                                                                    "rounded-xl transition-all",
                                                                    item._removed ? "text-primary hover:bg-primary/10" : "text-destructive/20 hover:text-destructive hover:bg-destructive/10"
                                                                )}
                                                            >
                                                                {item._removed ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="bg-black/40 p-4 border-t border-white/5 flex justify-between items-center text-[9px] text-muted-foreground font-semibold uppercase opacity-30">
                    <span className="flex items-center gap-2 italic"><CheckCircle2 className="h-3 w-3" /> Restore Engine v1.9.8</span>
                    <span>iPOS Luxury Elite</span>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
