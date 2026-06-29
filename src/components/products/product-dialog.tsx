'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Product, Supplier, ProductCreateInput } from '@/lib/types';
import { 
    Loader2, 
    X, 
    AlertTriangle, 
    Plus, 
    Package, 
    Hash, 
    Box, 
    Building, 
    Coins, 
    FileText, 
    CheckCircle2,
    Tag,
    CalendarClock,
    Scale,
    Search,
    ChevronRight,
    UserPlus,
    Building2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { productService } from '@/services/product.service';
import { supplierService } from '@/services/supplier.service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, safeNumber, formatCurrency } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';

interface ProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
    suppliers: Supplier[];
    onSuccess: () => void;
}

const initialFormState: Partial<Product> & { supplierName?: string } = {
    name: '',
    price: 0,
    purchasePrice: 0,
    quantity: 0,
    minStockLevel: 10,
    barcodes: [],
    unit: 'Pièce',
    category: 'Général',
    dateExpiration: undefined,
    supplierUuid: undefined,
    supplierName: '',
};

const units: NonNullable<Product['unit']>[] = ['Pièce', 'Kg', 'Litre', 'Boîte', 'Carton', 'Sachet', 'Bouteille'];

export function ProductDialog({ isOpen, onOpenChange, product, suppliers, onSuccess }: ProductDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [currentBarcode, setCurrentBarcode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPriceConfirm, setShowPriceConfirm] = useState(false);

    // Supplier Selection State
    const [supplierSearch, setSupplierSearch] = useState('');
    const [isSupplierSelectOpen, setIsSupplierSelectOpen] = useState(false);

    useEffect(() => {
        if (product && isOpen) {
            const supplier = suppliers.find(s => s.uuid === product.supplierUuid);
            setFormState({
                ...product,
                dateExpiration: product.dateExpiration ? new Date(product.dateExpiration) : undefined,
                supplierName: supplier?.name || '',
            });
        } else if (!product && isOpen) {
            setFormState(initialFormState);
        }
        setError(null);
        setSupplierSearch('');
    }, [product, isOpen, suppliers]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormState(prev => ({ 
            ...prev, 
            [id]: type === 'number' ? (value === '' ? undefined : value) : value 
        }));
    };

    const handleAddBarcode = () => {
        const barcode = currentBarcode.trim();
        if (barcode && !formState.barcodes?.includes(barcode)) {
            setFormState(prev => ({ ...prev, barcodes: [...(prev.barcodes || []), barcode] }));
            setCurrentBarcode('');
        }
    };
    
    const handleRemoveBarcode = (barcodeToRemove: string) => {
        setFormState(prev => ({...prev, barcodes: prev.barcodes?.filter(b => b !== barcodeToRemove)}));
    };

    const handleSupplierSelect = (supplier: Supplier) => {
        setFormState(prev => ({ ...prev, supplierUuid: supplier.uuid, supplierName: supplier.name }));
        setIsSupplierSelectOpen(false);
        toast.success(`تم اختيار المورد: ${supplier.name}`);
    };

    const handleCreateNewSupplier = () => {
        const name = supplierSearch.trim();
        if (!name) return;
        setFormState(prev => ({ ...prev, supplierUuid: undefined, supplierName: name }));
        setIsSupplierSelectOpen(false);
        toast.info(`المورد "${name}" جديد`, {
            description: "سيتم إنشاؤه تلقائياً عند حفظ المنتج."
        });
    };

    const filteredSuppliers = useMemo(() => {
        if (!supplierSearch.trim()) return suppliers.slice(0, 50);
        const q = supplierSearch.toLowerCase().trim();
        return suppliers.filter(s => 
            s.name.toLowerCase().includes(q) || 
            (s.phone && s.phone.includes(q))
        );
    }, [suppliers, supplierSearch]);

    const isExistingSupplier = useMemo(() => {
        return suppliers.some(s => s.name.toLowerCase() === supplierSearch.toLowerCase().trim());
    }, [suppliers, supplierSearch]);

    const proceedWithSubmit = async () => {
        if (isLoading) return;
        setError(null);
        setIsLoading(true);
        try {
            let targetSupplierUuid = formState.supplierUuid;
            if (!targetSupplierUuid && formState.supplierName?.trim()) {
                const resolvedSupplier = await supplierService.findOrCreateSupplier(formState.supplierName.trim());
                targetSupplierUuid = resolvedSupplier.uuid;
            }

            const finalData: ProductCreateInput = {
                name: formState.name || '',
                price: safeNumber(formState.price),
                purchasePrice: safeNumber(formState.purchasePrice),
                quantity: safeNumber(formState.quantity),
                minStockLevel: safeNumber(formState.minStockLevel),
                unit: formState.unit as Product['unit'],
                category: formState.category,
                barcodes: formState.barcodes,
                dateExpiration: formState.dateExpiration,
                supplierUuid: targetSupplierUuid
            };

            if (product) await productService.updateProduct(product.uuid, finalData);
            else await productService.addProduct(finalData);
            
            toast.success(`تمت مزامنة المنتج بنجاح.`);
            onOpenChange(false);
            onSuccess();
        } catch (err: any) {
            setError(err.message || "حدث خطأ غير متوقع.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isLoading) return;
        const p = safeNumber(formState.price);
        const cost = safeNumber(formState.purchasePrice);
        if (p < cost && p > 0) setShowPriceConfirm(true);
        else await proceedWithSubmit();
    };

    useKeyboardShortcuts([
        {
            key: 'Enter',
            ctrl: true,
            action: () => handleSubmit(),
            description: 'حفظ المنتج',
            ignoreInputFocus: true
        }
    ], 'ProductDialog', isOpen);

    const SectionHeader = ({ title, icon: Icon, description }: { title: string, icon: any, description?: string }) => (
        <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-sm">
                    <Icon className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">{title}</h4>
            </div>
            {description && <p className="text-[10px] text-muted-foreground/60 ml-10">{description}</p>}
        </div>
    );

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-xl">
                                <Package className="h-8 w-8" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                                    {product ? 'تعديل مرجع' : 'إضافة مرجع جديد'}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40 mt-1">
                                    {product ? `ID: ${product.uuid.substring(0,8)}` : 'بروتوكول إضافة منتج Elite'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 grid md:grid-cols-2 gap-x-12 gap-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {error && <div className="md:col-span-2 p-4 bg-destructive/10 text-destructive rounded-2xl text-xs font-bold border border-destructive/20 text-center animate-in zoom-in-95">{error}</div>}
                        
                        {/* SECTION 1: IDENTITY */}
                        <div className="space-y-6">
                            <SectionHeader 
                                title="هوية المنتج" 
                                icon={FileText} 
                                description="المعلومات الأساسية والتعريفية للمنتج."
                            />
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase opacity-40 ml-1">التسمية التجارية *</Label>
                                    <Input 
                                        id="name" 
                                        value={formState.name} 
                                        onChange={handleInputChange} 
                                        className="h-12 rounded-2xl bg-muted/20 border-none shadow-inner font-bold text-lg focus-visible:ring-primary/20" 
                                        placeholder="Ex: Coca-Cola 1.5L"
                                        required 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">الصنف</Label>
                                        <Input 
                                            id="category"
                                            value={formState.category} 
                                            onChange={handleInputChange}
                                            className="h-11 rounded-xl bg-muted/20 border-none shadow-inner font-bold"
                                            placeholder="Ex: Boissons"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">الوحدة</Label>
                                        <Select value={formState.unit} onValueChange={(value) => setFormState(s => ({ ...s, unit: value as any }))}>
                                            <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-none shadow-inner font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl shadow-xl border-white/5">
                                                {units.map(u => <SelectItem key={u} value={u} className="font-bold">{u}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">المورد</Label>
                                    <div 
                                        onClick={() => setIsSupplierSelectOpen(true)}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border-2 border-transparent hover:border-primary/20 transition-all cursor-pointer group shadow-inner"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-background border border-white/5 shadow-sm group-hover:scale-110 transition-transform">
                                                <Building2 className="h-4 w-4 text-primary/60" />
                                            </div>
                                            <div className="flex flex-col -space-y-0.5">
                                                <p className="font-bold text-sm tracking-tight">{formState.supplierName || "اختر مورداً..."}</p>
                                                <p className="text-[9px] font-black uppercase text-muted-foreground/30 tracking-widest">{formState.supplierUuid ? "مورد مسجل" : "مورد جديد"}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: PRICING */}
                        <div className="space-y-6">
                            <SectionHeader 
                                title="التسعير والهوامش" 
                                icon={Scale} 
                                description="إدارة التكاليف وأرباح الوحدة."
                            />
                            
                            <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-6 shadow-inner">
                                <div className="space-y-2">
                                    <Label htmlFor="purchasePrice" className="text-[10px] font-black uppercase text-primary/60 ml-1">سعر الشراء (PMP)</Label>
                                    <div className="relative group">
                                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/20 group-focus-within:text-primary transition-colors" />
                                        <Input 
                                            id="purchasePrice" 
                                            type="number" 
                                            step="0.01" 
                                            value={formState.purchasePrice ?? ''} 
                                            onChange={handleInputChange} 
                                            className="h-12 rounded-xl bg-background border-none shadow-sm font-black text-xl text-center pl-10" 
                                            required 
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-20 uppercase">DA</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-[10px] font-black uppercase text-primary ml-1">سعر البيع للجمهور</Label>
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-primary/20 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
                                        <Input 
                                            id="price" 
                                            type="number" 
                                            step="0.01" 
                                            value={formState.price ?? ''} 
                                            onChange={handleInputChange} 
                                            className="relative h-14 rounded-2xl bg-background border-none shadow-lg font-black text-3xl text-primary text-center" 
                                            required 
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-primary opacity-30 uppercase">DA</span>
                                    </div>
                                </div>

                                {safeNumber(formState.price) > 0 && (
                                    <div className="flex justify-between items-center px-2">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-tighter">هامش الربح المقدر</span>
                                            <span className={cn(
                                                "text-lg font-black tracking-tighter",
                                                safeNumber(formState.price) >= safeNumber(formState.purchasePrice) ? "text-emerald-500" : "text-destructive"
                                            )}>
                                                {(( (safeNumber(formState.price) - safeNumber(formState.purchasePrice)) / (safeNumber(formState.price) || 1) ) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <TrendingUp className={cn("h-8 w-8 opacity-10", safeNumber(formState.price) >= safeNumber(formState.purchasePrice) ? "text-emerald-500" : "text-destructive")} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator className="md:col-span-2 bg-white/5" />

                        {/* SECTION 3: STOCK */}
                        <div className="space-y-6">
                            <SectionHeader 
                                title="المخزون واللوجستيات" 
                                icon={Box} 
                                description="متابعة الكميات وتنبيهات النقص."
                            />
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity" className="text-[10px] font-black uppercase opacity-40 ml-1">الكمية المتوفرة</Label>
                                    <Input 
                                        id="quantity" 
                                        type="number" 
                                        step="0.001" 
                                        value={formState.quantity ?? ''} 
                                        onChange={handleInputChange} 
                                        className="h-12 rounded-xl bg-muted/20 border-none shadow-inner font-black text-center text-lg" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minStockLevel" className="text-[10px] font-black uppercase text-amber-500/60 ml-1">تنبيه النقص (سواء)</Label>
                                    <Input 
                                        id="minStockLevel" 
                                        type="number" 
                                        value={formState.minStockLevel ?? ''} 
                                        onChange={handleInputChange} 
                                        className="h-12 rounded-xl bg-amber-500/5 border-none shadow-inner font-black text-center text-lg text-amber-600" 
                                        required 
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1 flex items-center gap-2">
                                        <CalendarClock className="h-3 w-3" /> تاريخ انتهاء الصلاحية
                                    </Label>
                                    <DatePicker date={formState.dateExpiration} setDate={(date) => setFormState(s => ({...s, dateExpiration: date }))}/>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 4: BARCODES */}
                        <div className="space-y-6">
                            <SectionHeader 
                                title="التتبع (Barcode)" 
                                icon={Hash} 
                                description="إضافة رموز الباركود للتعرف السريع."
                            />
                            
                            <div className="p-6 rounded-3xl bg-black/40 border border-white/5 shadow-inner space-y-4">
                                <div className="flex gap-2">
                                    <div className="relative flex-grow group">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                        <Input 
                                            value={currentBarcode} 
                                            onChange={(e) => setCurrentBarcode(e.target.value)} 
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBarcode(); } }} 
                                            className="pl-10 h-11 rounded-xl bg-background border-none shadow-sm font-mono" 
                                            placeholder="مسح أو إدخال..." 
                                        />
                                    </div>
                                    <Button type="button" onClick={handleAddBarcode} variant="secondary" className="h-11 w-11 rounded-xl border border-white/10 shadow-lg p-0">
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 min-h-12 items-start content-start">
                                    {formState.barcodes?.length === 0 ? (
                                        <p className="text-[9px] font-bold uppercase text-muted-foreground/20 italic p-4 text-center w-full">لا يوجد كود محدد</p>
                                    ) : (
                                        formState.barcodes?.map(b => (
                                            <Badge key={b} variant="outline" className="pl-3 pr-1 py-1.5 rounded-xl bg-muted/30 border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                                <span className="font-mono text-[10px] font-black">{b}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveBarcode(b)} 
                                                    className="p-1 rounded-lg hover:bg-destructive/20 text-destructive/40 hover:text-destructive transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-muted/30 border-t border-white/5 flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-12 rounded-2xl font-black text-xs uppercase tracking-widest px-8" disabled={isLoading}>
                            إلغاء
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading} 
                            className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 gap-3"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                            {product ? 'تحديث المرجع' : 'تأكيد الإضافة'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        {/* PRICE LOSS CONFIRMATION */}
        <AlertDialog open={showPriceConfirm} onOpenChange={setShowPriceConfirm}>
            <AlertDialogContent className="rounded-3xl border-none shadow-2xl bg-card">
                <AlertDialogHeader>
                    <div className="flex items-center gap-4 mb-4 text-destructive">
                        <div className="p-4 rounded-2xl bg-destructive/10">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <AlertDialogTitle className="text-xl font-black tracking-tight uppercase">تنبيه: بيع بخسارة</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-sm font-medium leading-relaxed">
                        سعر البيع (<b>{formatCurrency(formState.price || 0)}</b>) أقل من تكلفة الشراء (<b>{formatCurrency(formState.purchasePrice || 0)}</b>). هل أنت متأكد من تأكيد هذا السعر؟
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3 mt-6">
                    <AlertDialogCancel className="h-11 rounded-2xl font-bold border-none bg-muted/20">مراجعة</AlertDialogCancel>
                    <AlertDialogAction onClick={proceedWithSubmit} className="h-11 rounded-2xl font-black text-xs uppercase bg-destructive hover:bg-destructive/90 shadow-xl">
                        تأكيد البيع بخسارة
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* SUPPLIER SELECTION DIALOG */}
        <Dialog open={isSupplierSelectOpen} onOpenChange={setIsSupplierSelectOpen}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight">قائمة الموردين</DialogTitle>
                            <p className="text-[10px] font-bold uppercase text-primary/50">اختر مورداً لهذا المنتج</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="البحث عن اسم المورد..."
                            className="pl-14 h-11 text-lg font-bold rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20"
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <ScrollArea className="h-[350px] pr-4 -mr-4">
                        <div className="space-y-2">
                            {filteredSuppliers.length > 0 ? (
                                filteredSuppliers.map(s => (
                                    <div 
                                        key={s.uuid}
                                        onClick={() => handleSupplierSelect(s)}
                                        className="group flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer shadow-inner"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-xl bg-background border border-white/5 shadow-sm group-hover:scale-110 transition-transform">
                                                <Building className="h-5 w-5 text-primary/60" />
                                            </div>
                                            <div className="flex flex-col -space-y-0.5">
                                                <p className="font-bold text-sm tracking-tight">{s.name}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground/50">{s.phone || 'بدون رقم هاتف'}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-all" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 opacity-20">
                                    <Building2 className="h-12 w-12 mx-auto mb-4" />
                                    <p className="text-sm font-bold uppercase">لا توجد نتائج</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="p-4 bg-muted/10 border-t border-white/5 flex gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={() => setIsSupplierSelectOpen(false)}
                        className="flex-1 h-11 rounded-2xl font-bold text-[10px] uppercase tracking-wide"
                    >
                        إلغاء
                    </Button>
                    {!isExistingSupplier && supplierSearch.trim() && (
                        <Button 
                            onClick={handleCreateNewSupplier}
                            className="flex-1 h-11 rounded-2xl font-bold text-[10px] uppercase tracking-wide gap-2 shadow-xl"
                        >
                            <UserPlus className="h-4 w-4" /> إنشاء مورد جديد باسم "{supplierSearch}"
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}