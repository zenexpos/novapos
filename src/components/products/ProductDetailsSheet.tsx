'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Product } from '@/lib/types';
import { formatCurrency, formatPercent, calculateMarginRate, safeNumber, preciseMultiply, roundFinancial } from '@/lib/utils';
import { 
    Package, 
    TrendingUp, 
    Coins, 
    Tag, 
    Building, 
    Edit,
    ArrowRight,
    ShoppingBag,
    Calculator,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ProductDetailsSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
    onEdit: () => void;
}

export function ProductDetailsSheet({ isOpen, onOpenChange, product, onEdit }: ProductDetailsSheetProps) {
    if (!product) return null;

    const qty = safeNumber(product.quantity);
    const cost = safeNumber(product.purchasePrice);
    const price = safeNumber(product.price);

    const marginRate = calculateMarginRate(price, cost);
    const inventoryValue = preciseMultiply(qty, cost);
    const potentialRevenue = preciseMultiply(qty, price);
    const potentialProfit = roundFinancial(potentialRevenue - inventoryValue);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full p-0 overflow-hidden flex flex-col border-white/5 bg-card/95 backdrop-blur-xl">
                <SheetHeader className="p-8 bg-primary/5 border-b border-white/5">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-xl">
                            <Package className="h-8 w-8" />
                        </div>
                        <Button onClick={onEdit} variant="outline" className="rounded-xl h-10 px-6 gap-2 border-primary/20 hover:bg-primary/5 transition-all">
                            <Edit className="h-4 w-4" /> Éditer Fiche
                        </Button>
                    </div>
                    <SheetTitle className="text-3xl font-black tracking-tighter uppercase leading-none">{product.name}</SheetTitle>
                    <SheetDescription className="text-[10px] font-black uppercase text-primary/40 tracking-[0.2em] mt-2">Référence Elite — {product.uuid.substring(0,8)}</SheetDescription>
                    
                    <div className="flex flex-wrap gap-2 mt-6">
                        <Badge variant="outline" className="px-3 py-1 rounded-lg border-white/10 bg-black/20 text-[9px] font-bold uppercase tracking-widest">{product.category || 'Général'}</Badge>
                        <Badge variant="outline" className="px-3 py-1 rounded-lg border-white/10 bg-black/20 text-[9px] font-bold uppercase tracking-widest">{product.unit || 'Pièce'}</Badge>
                    </div>
                </SheetHeader>

                <div className="flex-grow overflow-y-auto p-8 space-y-12 custom-scrollbar">
                    {/* SECTION : STATS DE STOCK */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <BoxIcon className="h-4 w-4 text-primary opacity-40" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Gestion des Unités</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                                <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">En Stock</p>
                                <p className="text-3xl font-black tabular-nums">{qty}<span className="text-xs ml-1 opacity-20">{product.unit ?? 'PCS'}</span></p>
                            </div>
                            <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                                <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">Seuil Alerte</p>
                                <p className="text-3xl font-black tabular-nums text-amber-500">{product.minStockLevel}<span className="text-xs ml-1 opacity-20">{product.unit ?? 'PCS'}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION : ANALYSE FINANCIÈRE */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Calculator className="h-4 w-4 text-primary opacity-40" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Valorisation & Marges</h4>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-4 rounded-xl border border-white/5 bg-muted/20">
                                <span className="text-xs font-bold uppercase opacity-60">Prix d'Achat (PMP)</span>
                                <span className="font-mono font-black text-sm">{formatCurrency(cost)}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-xl border border-primary/20 bg-primary/5">
                                <span className="text-xs font-bold uppercase text-primary">Prix de Vente</span>
                                <span className="font-mono font-black text-lg text-primary">{formatCurrency(price)}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                                <span className="text-xs font-bold uppercase text-emerald-600">Marge Brute</span>
                                <div className="text-right">
                                    <p className="font-mono font-black text-lg text-emerald-600">{formatPercent(marginRate)}</p>
                                    <p className="text-[8px] font-bold text-emerald-600/50 uppercase tracking-tighter">Profit net: {formatCurrency(roundFinancial(price - cost))}/u</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION : IMPACT INVENTAIRE */}
                    <div className="space-y-6 p-6 rounded-3xl bg-black/40 border border-white/5 shadow-inner">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-center mb-6">Simulation Valeur Inventaire</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-40">
                                <span>Coût Immobilisé</span>
                                <span>{formatCurrency(inventoryValue)}</span>
                            </div>
                            <Separator className="bg-white/5" />
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-40">
                                <span>Chiffre Affaires Potentiel</span>
                                <span>{formatCurrency(potentialRevenue)}</span>
                            </div>
                            <Separator className="bg-white/5" />
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Profit Attendu</span>
                                <span className="font-black text-xl text-emerald-500 tabular-nums">{formatCurrency(potentialProfit)}</span>
                            </div>
                        </div>
                    </div>

                    {/* INFOS COMPLÉMENTAIRES */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-white/5 group">
                            <div className="p-3 rounded-xl bg-background border border-white/5 group-hover:scale-110 transition-transform">
                                <Building className="h-4 w-4 opacity-40" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">Dernier Mouvement</p>
                                <p className="text-xs font-bold">{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('fr-FR') : 'Non spécifié'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-white/5 group">
                            <div className="p-3 rounded-xl bg-background border border-white/5 group-hover:scale-110 transition-transform">
                                <ShoppingBag className="h-4 w-4 opacity-40" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">Volume de Sortie</p>
                                <p className="text-xs font-bold">{product.totalSold || 0} Unités vendues</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-emerald-500">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Données Certifiées Locales</span>
                    </div>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2">
                        Fermer Dossier <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function BoxIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}
