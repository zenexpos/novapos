'use client';

import React from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, formatCurrency, safeNumber } from '@/lib/utils';
import { numberToFrenchWords } from '@/lib/numberToWords';

interface ReceiptProps {
    sale: Sale;
    profile: CompanyProfile | null;
    receiptType: 'a4' | 'thermal';
    customerName?: string;
    oldBalance?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Thermal receipt — 80mm monochrome optimized (High Density)
// ─────────────────────────────────────────────────────────────────────────────
const ThermalReceipt = ({ sale, profile, customerName, oldBalance = 0 }: Omit<ReceiptProps, 'receiptType'>) => {
    const fmt = (v: number) => v.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const date = sale.createdAt
        ? format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })
        : format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
    
    const currentDebtOfThisSale = Math.max(0, sale.total - sale.amountPaid);
    const newBalance = oldBalance + currentDebtOfThisSale;

    return (
        <div className="thermal-receipt bg-white text-black font-mono"
            style={{ 
              fontSize: '10pt', 
              width: '76mm', 
              margin: '0 auto', 
              padding: '8mm 2mm', 
              lineHeight: 1.2
            }}>
            <div className="text-center mb-6">
                <p className="font-black text-[13pt] uppercase mb-1">{profile?.companyName ?? 'iPOS ZEN ELITE'}</p>
                {profile?.address && <p className="text-[8pt] leading-tight opacity-90">{profile.address}</p>}
                {profile?.phone   && <p className="text-[9.5pt] font-bold mt-2">Tél: {profile.phone}</p>}
            </div>

            <div className="border-y-2 border-black border-dashed py-3 mb-6 text-center">
                <p className="font-black text-[11.5pt] uppercase tracking-tighter">BON DE LIVRAISON</p>
                <p className="text-[10pt] font-bold mt-1">#{sale.invoiceNumber}</p>
            </div>

            <div className="text-[8.5pt] mb-6 space-y-1">
                <div className="flex justify-between"><span>DATE :</span> <span className="font-bold">{date}</span></div>
                <div className="flex justify-between"><span>CLIENT :</span> <span className="font-bold">{customerName?.toUpperCase() || 'CLIENT DE PASSAGE'}</span></div>
            </div>

            <table className="w-full text-[9pt] mb-6 border-collapse">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left py-1.5 uppercase font-black">Designation</th>
                        <th className="text-center py-1.5 w-10 uppercase font-black">Qté</th>
                        <th className="text-right py-1.5 w-20 uppercase font-black">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, i) => (
                        <tr key={i} className="border-b border-black/10 border-dotted">
                            <td className="py-2.5 pr-1 font-bold uppercase leading-tight text-[8.5pt]">{item.name}</td>
                            <td className="text-center py-2.5 font-bold">{item.quantity}</td>
                            <td className="text-right py-2.5 font-black">{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t-2 border-black pt-3 space-y-2">
                <div className="flex justify-between text-[9pt]">
                    <span>SOUS-TOTAL:</span>
                    <span className="font-bold">{fmt(sale.subtotal)}</span>
                </div>
                {safeNumber(sale.discountAmount) > 0.01 && (
                    <div className="flex justify-between text-[9pt] italic font-bold">
                        <span>REMISE :</span>
                        <span>-{fmt(safeNumber(sale.discountAmount))}</span>
                    </div>
                )}
                <div className="flex justify-between font-black text-[11.5pt] mt-2 border-y-2 border-black py-2">
                    <span>NET A PAYER:</span>
                    <span>{fmt(sale.total)}</span>
                </div>
                
                <div className="flex justify-between text-[9.5pt] pt-1">
                    <span>VERSÉ (REÇU):</span>
                    <span className="font-bold text-emerald-600">-{fmt(safeNumber(sale.amountPaid))}</span>
                </div>

                <div className="flex justify-between font-black text-[11pt] bg-black text-white px-2 py-2 mt-2">
                    <span>SOLDE DÛ :</span>
                    <span>{fmt(newBalance)} DA</span>
                </div>
            </div>

            <div className="text-center mt-12 border-t-2 border-black border-dashed pt-6 opacity-50 text-[7.5pt] uppercase font-bold tracking-widest">
                <p>Merci de votre confiance</p>
                <p className="mt-1.5">Système iPOS Zen Sovereign</p>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// A4 Receipt — Institutional Luxury Layout (Standard Algérien)
// ─────────────────────────────────────────────────────────────────────────────
const A4Receipt = ({ sale, profile, customerName, oldBalance = 0 }: Omit<ReceiptProps, 'receiptType'>) => {
    const fmt = (v: number) => v.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const date = sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy');
    
    const currentDebtOfThisSale = Math.max(0, sale.total - sale.amountPaid);
    const newBalance = oldBalance + currentDebtOfThisSale;

    return (
        <div className="a4-receipt-wrapper bg-white text-black p-12 font-sans" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
            {/* Header المؤسساتي */}
            <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-12">
                <div className="space-y-2 max-w-[65%]">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-primary">{profile?.companyName ?? 'iPOS ZEN ELITE'}</h1>
                    <p className="text-sm font-bold opacity-80 leading-relaxed">{profile?.address || 'Adresse non configurée'}</p>
                    <p className="text-sm font-bold opacity-80">Tél: <span className="font-mono">{profile?.phone || '—'}</span></p>
                    
                    {/* Algerian Tax Details */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6 pt-6 border-t border-black/10">
                       {profile?.rc_number && <p className="text-[10pt] font-mono font-bold uppercase">RC: {profile.rc_number}</p>}
                       {profile?.nif && <p className="text-[10pt] font-mono font-bold uppercase">NIF: {profile.nif}</p>}
                       {profile?.ai_number && <p className="text-[10pt] font-mono font-bold uppercase">AI: {profile.ai_number}</p>}
                       {profile?.nis_number && <p className="text-[10pt] font-mono font-bold uppercase">NIS: {profile.nis_number}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-black text-white px-8 py-3 rounded-md mb-6 inline-block shadow-xl">
                        <h2 className="text-2xl font-black uppercase tracking-widest">BON DE LIVRAISON</h2>
                    </div>
                    <p className="text-3xl font-mono font-black tracking-tight mb-2">N° {sale.invoiceNumber}</p>
                    <p className="text-sm font-black uppercase text-gray-500">Émis le : {date}</p>
                </div>
            </div>

            {/* Informations Client */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="bg-gray-50 p-8 rounded-2xl border-2 border-black/5 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Destinataire / Client</p>
                    <p className="text-2xl font-black tracking-tight uppercase leading-tight">{customerName || 'Client de passage'}</p>
                </div>
                
                <div className="p-8 border-2 border-dashed border-black/10 rounded-2xl flex flex-col items-end justify-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Nature de l'opération</p>
                    <p className="text-xl font-black uppercase text-primary">
                        {sale.paymentStatus === 'paid' ? 'Vente au Comptant' : 'Vente à Crédit'}
                    </p>
                    {sale.dueDate && (
                        <p className="text-xs font-bold text-destructive mt-2 uppercase tracking-wide">
                            Échéance de paiement : {format(new Date(sale.dueDate), 'dd/MM/yyyy')}
                        </p>
                    )}
                </div>
            </div>

            {/* Table des Articles */}
            <table className="w-full border-collapse mb-12 overflow-hidden rounded-2xl">
                <thead>
                    <tr className="bg-black text-white">
                        <th className="p-5 text-left text-[11pt] font-black uppercase tracking-widest">Designation des Produits</th>
                        <th className="p-5 text-center text-[11pt] font-black uppercase tracking-widest w-24">Qté</th>
                        <th className="p-5 text-right text-[11pt] font-black uppercase tracking-widest w-40">P.U (DA)</th>
                        <th className="p-5 text-right text-[11pt] font-black uppercase tracking-widest w-44">Total (DA)</th>
                    </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-50 border-x-2 border-black/5">
                    {sale.items.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-gray-50/50">
                            <td className="p-5 font-bold uppercase text-[10pt] leading-relaxed">{item.name}</td>
                            <td className="p-5 text-center font-black text-[12pt]">{item.quantity}</td>
                            <td className="p-5 text-right font-mono text-[11pt]">{fmt(item.price)}</td>
                            <td className="p-5 text-right font-black text-[12pt]">{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Récapitulatif Financier */}
            <div className="flex justify-end mb-16">
                <div className="w-[500px] space-y-4">
                    <div className="flex justify-between text-[11pt] font-bold text-gray-500 px-6">
                        <span className="uppercase tracking-widest">Sous-Total Brut</span>
                        <span className="font-mono">{fmt(sale.subtotal)} DA</span>
                    </div>
                    
                    {safeNumber(sale.discountAmount) > 0.01 && (
                        <div className="flex justify-between text-[11pt] font-black text-emerald-600 px-6">
                            <span className="uppercase tracking-widest">Remise Spéciale</span>
                            <span className="font-mono">-{fmt(safeNumber(sale.discountAmount))} DA</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center bg-black text-white p-8 rounded-2xl shadow-2xl">
                        <span className="font-black uppercase text-[12pt] tracking-[0.3em]">NET A PAYER (DA)</span>
                        <span className="text-4xl font-black tracking-tighter tabular-nums">{fmt(sale.total)}</span>
                    </div>

                    <div className="pt-8 mt-6 border-t-4 border-double border-gray-100 px-6 space-y-3">
                        <div className="flex justify-between text-[11pt] font-bold">
                            <span className="uppercase opacity-40 italic">Versement Effectué</span>
                            <span className="text-emerald-600 font-black">-{fmt(safeNumber(sale.amountPaid))} DA</span>
                        </div>
                        <div className="flex justify-between items-center text-3xl font-black text-red-600 pt-4 border-t border-black/5 mt-4">
                            <span className="uppercase text-[10pt] tracking-[0.2em]">Reste à Recouvrer</span>
                            <span className="tracking-tighter tabular-nums">{fmt(newBalance)} DA</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Arrêté de la facture */}
            <div className="p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 mb-16 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-3 h-full bg-primary" />
                <p className="text-[10pt] font-black uppercase text-gray-400 mb-3 tracking-widest">Arrêtée la présente facture à la somme de :</p>
                <p className="text-[12pt] font-black uppercase leading-relaxed text-secondary italic">
                    {numberToFrenchWords(sale.total)}
                </p>
            </div>

            {/* Zone de Signature & Cachet */}
            <div className="flex justify-between px-16 text-center mt-auto pt-12">
                <div className="space-y-24">
                    <p className="text-[11pt] font-black uppercase tracking-[0.2em] opacity-40">Cachet & Signature</p>
                    <div className="h-32 w-32 mx-auto border-4 border-gray-50 rounded-full flex items-center justify-center opacity-5">
                        <span className="text-[10pt] font-black">STAMP</span>
                    </div>
                </div>
                <div className="space-y-24">
                    <p className="text-[11pt] font-black uppercase tracking-[0.2em] opacity-40">Accusé de Réception</p>
                    <p className="text-[11pt] italic text-gray-300 font-medium">"Bon pour accord et réception"</p>
                </div>
            </div>

            {/* Footer السيادي */}
            <footer className="mt-24 pt-10 border-t border-gray-100 flex justify-between items-center text-[9pt] font-bold text-gray-300 uppercase tracking-widest">
                <span>iPOS ZEN v2.10 — SOVEREIGN LEDGER SYSTEM</span>
                <span className="font-mono">DOC-ID: {sale.uuid.substring(0,12).toUpperCase()}</span>
                <span>Document Original</span>
            </footer>
        </div>
    );
};

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
    ({ sale, profile, receiptType, customerName, oldBalance = 0 }, ref) => {
        const props = { sale, profile, customerName, oldBalance };
        return (
            <div ref={ref} className={cn("print-area-root", receiptType === 'thermal' ? 'thermal-receipt' : 'a4-receipt')}>
                {receiptType === 'thermal' ? <ThermalReceipt {...props} /> : <A4Receipt {...props} />}
            </div>
        );
    }
);

Receipt.displayName = 'Receipt';
