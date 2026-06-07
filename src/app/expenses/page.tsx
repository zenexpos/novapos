'use client';

import { useState, useMemo, useRef } from 'react';
import { useDebouncedAbortSignal } from '@/hooks/useDebounce';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Plus, 
    FileUp, 
    Search, 
    RefreshCw, 
    Wallet, 
    FilterX, 
    PieChart,
    CalendarDays,
    BarChart3,
    Trash2,
    X,
    Printer,
    SortAsc,
    Sparkles,
    TrendingDown,
    Filter,
    LayoutGrid,
    List
} from 'lucide-react';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import { DeleteExpenseDialog } from '@/components/expenses/DeleteExpenseDialog';
import { DeleteMultipleExpensesDialog } from '@/components/expenses/DeleteMultipleExpensesDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, cn, safeNumber } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/appStore';
import { format, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import Papa from 'papaparse';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/lib/db';

const COLORS = [
    'hsl(var(--primary))', 
    'hsl(var(--chart-secondary))', 
    'hsl(var(--chart-tertiary))', 
    'hsl(var(--chart-quaternary))', 
    'hsl(var(--chart-quinary))'
];

const sortOptions = {
    'date_desc': 'Plus récents',
    'date_asc': 'Plus anciens',
    'amount_desc': 'Montant (Max)',
    'amount_asc': 'Montant (Min)',
};

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string, icon: any, colorClass: string, subtitle?: string }) => (
    <Card className="app-card h-full glass rounded-lg group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
            <CardTitle className="text-[10px] font-semibold uppercase text-muted-foreground group-hover:text-primary transition-all duration-500">{title}</CardTitle>
            <div className={cn("p-3 rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-110", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
            <div className="text-xl font-semibold tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left mb-1">{value}</div>
            {subtitle && <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/40">{subtitle}</p>}
        </CardContent>
    </Card>
);

export default function ExpensesPage() {
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    // FIX: Individual selectors to avoid reference instability in React 19
    const viewMode = useAppStore(state => state.expensesViewMode);
    const setViewMode = useAppStore(state => state.actions.setExpensesViewMode);
    const profile = useAppStore(state => state.companyProfile);

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const { debouncedValue: debouncedSearch, signal } = useDebouncedAbortSignal(searchQuery, 300);
    
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
    
    const { dateRange, setDate, isMounted } = useDateRange(29);

    // ─── LIVE DATA ──────────────────────────────────────────

    const allExpensesResult = useLiveQuery<Expense[]>(async () => {
        if (!isMounted || !dateRange?.from) return [];
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to || new Date());
        
        let collection = db.expenses.where('expenseDate').between(start, end, true, true);
        const data = await collection.toArray();
        
        let filtered = [...data];
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(e => e.category === selectedCategory);
        }
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            filtered = filtered.filter(e => e.description.toLowerCase().includes(q));
        }

        filtered.sort((a, b) => {
            switch(sortBy) {
                case 'amount_desc': return Number(b.amount) - Number(a.amount);
                case 'amount_asc': return Number(a.amount) - Number(b.amount);
                case 'date_asc': return new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime();
                case 'date_desc': 
                default: return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
            }
        });
        
        return filtered;
    }, [isMounted, dateRange, selectedCategory, debouncedSearch, sortBy, signal]);

    const categoriesResult = useLiveQuery<string[]>(async () => {
        const exps = await db.expenses.toArray() as Expense[];
        return Array.from(new Set(exps.map(e => e.category))).sort();
    });

    const categories = categoriesResult.value ?? [];
    const allExpenses = allExpensesResult.value ?? [];
    const isLoading = allExpensesResult.isLoading || !isMounted;

    const stats = useMemo(() => {
        if (allExpenses.length === 0) return { total: 0, count: 0, topCategory: '-', chartData: [], dailyAverage: 0 };
        
        // Calcul précision Elite
        let totalCents = 0;
        const catMapCents = new Map<string, number>();

        allExpenses.forEach(e => {
            const valCents = Math.round(safeNumber(e.amount) * 100);
            totalCents += valCents;
            catMapCents.set(e.category, (catMapCents.get(e.category) || 0) + valCents);
        });
        
        let topCat = '-';
        let maxValCents = 0;
        catMapCents.forEach((val, cat) => {
            if (val > maxValCents) {
                maxValCents = val;
                topCat = cat;
            }
        });

        const chartData = Array.from(catMapCents.entries())
            .map(([name, valueCents]) => ({ name, value: valueCents / 100 }))
            .sort((a, b) => b.value - a.value);

        const days = dateRange?.from && dateRange?.to 
            ? Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1)
            : 1;
        
        return { 
            total: totalCents / 100, 
            count: allExpenses.length, 
            topCategory: topCat, 
            chartData, 
            dailyAverage: (totalCents / 100) / days 
        };
    }, [allExpenses, dateRange]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedExpenses(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleToggleSelectAll = () => {
        if (!allExpenses) return;
        if (selectedExpenses.size === allExpenses.length) {
            setSelectedExpenses(new Set());
        } else {
            setSelectedExpenses(new Set(allExpenses.map(e => e.uuid)));
        }
    };

    const handleExportCsv = () => {
        const dataToExport = selectedExpenses.size > 0 
            ? (allExpenses?.filter(e => selectedExpenses.has(e.uuid)) || [])
            : (allExpenses || []);

        if (dataToExport.length === 0) {
            toast.error("Aucune dépense à exporter.");
            return;
        }

        const csv = Papa.unparse(dataToExport.map(e => ({
            Date: new Date(e.expenseDate).toLocaleDateString('fr-FR'),
            Description: e.description,
            Catégorie: e.category,
            Montant: e.amount
        })));

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ipos-depenses-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${dataToExport.length} dépense(s) exportée(s).`);
    };

    const handlePrintSummary = () => {
        if (!allExpenses || allExpenses.length === 0) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dateStr = dateRange?.from ? `${format(dateRange.from, 'dd/MM/yyyy')} au ${format(dateRange.to!, 'dd/MM/yyyy')}` : 'Toutes les dates';

        const html = `
            <html>
                <head>
                    <title>Rapport de Dépenses - iPOS Zen</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; }
                        header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: -0.05em; }
                        .summary-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
                        .stat-card { border: 1px solid #eee; padding: 15px; border-radius: 12px; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                        th, td { border-bottom: 1px solid #eee; padding: 12px 8px; text-align: left; }
                        th { background-color: #f9f9f9; font-weight: 900; text-transform: uppercase; }
                        .amount { text-align: right; font-family: monospace; font-size: 12px; font-weight: 700; }
                    </style>
                </head>
                <body>
                    <header>
                        <div>
                            <h1>${profile?.companyName || 'iPOS Zen'}</h1>
                            <p>${profile?.address || ''}</p>
                        </div>
                        <div style="text-align: right">
                            <p>RAPPORT DE DÉPENSES ELITE</p>
                            <p>Période: ${dateStr}</p>
                        </div>
                    </header>
                    <div class="summary-grid">
                        <div class="stat-card"><h3>${formatCurrency(stats.total)}</h3><p>Total</p></div>
                        <div class="stat-card"><h3>${stats.count}</h3><p>Opérations</p></div>
                    </div>
                    <table>
                        <thead>
                            <tr><th>Date</th><th>Description</th><th>Catégorie</th><th style="text-align: right;">Montant</th></tr>
                        </thead>
                        <tbody>
                            ${allExpenses.map(e => `
                                <tr>
                                    <td>${format(new Date(e.expenseDate), 'dd/MM/yyyy')}</td>
                                    <td><b>${e.description}</b></td>
                                    <td>${e.category}</td>
                                    <td class="amount">${formatCurrency(e.amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    const handleEditExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsExpenseDialogOpen(true);
    };

    const handleDeleteExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDeleteExpense = async () => {
        if (!selectedExpense) return;
        await db.expenses.where('uuid').equals(selectedExpense.uuid).delete();
        setIsDeleteDialogOpen(false);
        allExpensesResult.refresh();
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSortBy('date_desc');
    };

    useKeyboardShortcuts([
        {
            key: 'F3',
            action: () => searchInputRef.current?.focus(),
            description: 'Rechercher une charge',
            ignoreInputFocus: true
        },
        {
            key: 'n',
            action: () => { setSelectedExpense(null); setIsExpenseDialogOpen(true); },
            description: 'Nouvelle dépense',
            ignoreInputFocus: false
        }
    ], 'Charges');

    const isFiltered = searchQuery !== '' || selectedCategory !== 'all' || sortBy !== 'date_desc';
    
    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader
                title="Registre des Charges"
                description="Pilotage souverain des flux sortants et de la trésorerie"
            >
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" onClick={handlePrintSummary} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide border-primary/20 hover:bg-primary/5 transition-all">
                        <Printer className="mr-2 h-4 w-4 text-primary" /> Rapport
                    </Button>
                    <Button variant="outline" onClick={handleExportCsv} className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide border-primary/20 hover:bg-primary/5 transition-all">
                        <FileUp className="mr-2 h-4 w-4 text-primary" /> Exporter
                    </Button>
                    <Button 
                        onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }}
                        className="flex-1 sm:flex-none h-12 rounded-2xl font-semibold text-xs uppercase tracking-wide shadow-xl transition-all active:scale-95 gap-3"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle Dépense [N]
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Décaissements" 
                    value={formatCurrency(stats.total)} 
                    icon={Wallet} 
                    colorClass="bg-destructive/10 text-destructive"
                    subtitle={`${stats.count} opérations`}
                />
                <StatCard 
                    title="Charge Journalière" 
                    value={formatCurrency(stats.dailyAverage)} 
                    icon={TrendingDown} 
                    colorClass="bg-primary/10 text-primary"
                    subtitle="Moyenne période"
                />
                <StatCard 
                    title="Poste Dominant" 
                    value={stats.topCategory} 
                    icon={PieChart} 
                    colorClass="bg-amber-500/10 text-amber-500"
                    subtitle="Max centre coût"
                />
                <StatCard 
                    title="Fréquence Flux" 
                    value={(stats.count / Math.max(1, differenceInDays(dateRange?.to || new Date(), dateRange?.from || new Date()) + 1)).toFixed(1)} 
                    icon={CalendarDays} 
                    colorClass="bg-emerald-500/10 text-emerald-500"
                    subtitle="Opérations / jour"
                />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/20 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
                <div className="relative group flex-grow max-w-xl px-4">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-500" />
                    <Input 
                        ref={searchInputRef}
                        placeholder="Rechercher par description [F3]..."
                        className="pl-14 h-9 rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20 font-bold text-lg"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-3 px-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-12 rounded-xl border-white/5 bg-black/20 hover:bg-white/5 font-bold px-6">
                                <Filter className="mr-2 h-4 w-4 opacity-50" />
                                {selectedCategory === 'all' ? 'Toutes Catégories' : selectedCategory}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-2xl border-white/5 shadow-sm min-w-[200px] max-h-80 overflow-y-auto">
                            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Filtrer par Poste</DropdownMenuLabel>
                            <DropdownMenuSeparator className="opacity-10" />
                            <DropdownMenuCheckboxItem checked={selectedCategory === 'all'} onCheckedChange={() => setSelectedCategory('all')}>Toutes</DropdownMenuCheckboxItem>
                            {categories?.map(cat => (
                                <DropdownMenuCheckboxItem key={cat} checked={selectedCategory === cat} onCheckedChange={() => setSelectedCategory(cat)}>{cat}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DateRangePicker date={dateRange} setDate={setDate} />

                    <div className="flex items-center gap-1 p-1 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-10 w-10" onClick={() => setViewMode('grid')}><LayoutGrid className="h-5 w-5"/></Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="rounded-xl h-10 w-10" onClick={() => setViewMode('list')}><List className="h-5 w-5"/></Button>
                    </div>

                    {isFiltered && (
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-destructive hover:bg-destructive/10" onClick={resetFilters}><FilterX className="h-5 w-5" /></Button>
                    )}
                </div>
            </div>

            <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
               {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-lg bg-card/40 animate-pulse" />)}
                    </div>
               ) : allExpenses.length === 0 ? (
                    <EmptyState
                        icon={TrendingDown}
                        title="Silence de Caisse"
                        description={isFiltered ? "Ajustez vos filtres." : "Enregistrer votre première opération."}
                    />
               ) : (
                    viewMode === 'list' ? (
                        <ExpenseTable 
                            expenses={allExpenses}
                            onEdit={handleEditExpense}
                            onDelete={handleDeleteExpense}
                            selectedExpenses={selectedExpenses}
                            onToggleSelection={handleToggleSelection}
                            onToggleSelectAll={handleToggleSelectAll}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {allExpenses.map(e => (
                                <ExpenseCard 
                                    key={e.uuid} 
                                    expense={e} 
                                    onEdit={handleEditExpense} 
                                    onDelete={handleDeleteExpense}
                                    isSelected={selectedExpenses.has(e.uuid)}
                                    onToggleSelection={() => handleToggleSelection(e.uuid)}
                                />
                            ))}
                        </div>
                    )
               )}
            </div>
            
            <ExpenseDialog 
                isOpen={isExpenseDialogOpen}
                onOpenChange={setIsExpenseDialogOpen}
                expense={selectedExpense}
                onSuccess={() => {
                    allExpensesResult.refresh();
                    categoriesResult.refresh();
                }}
                existingCategories={categories}
            />
            <DeleteExpenseDialog 
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                name={selectedExpense?.description}
                onConfirm={handleConfirmDeleteExpense}
            />
        </div>
    );
}
