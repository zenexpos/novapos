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
// A4 Receipt — Monochrome & Compact (Institutional Standard)
// ─────────────────────────────────────────────────────────────────────────────
const A4Receipt = ({ sale, profile, customerName, oldBalance = 0 }: Omit<ReceiptProps, 'receiptType'>) => {
    const fmt = (v: number) => v.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const date = sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy');
    
    const currentDebtOfThisSale = Math.max(0, sale.total - sale.amountPaid);
    const newBalance = oldBalance + currentDebtOfThisSale;

    return (
        <div className="a4-receipt-wrapper bg-white text-black p-8 font-sans" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', margin: '0 auto' }}>
            {/* Header المؤسساتي المبسط */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                <div className="space-y-1 max-w-[65%]">
                    <h1 className="text-xl font-bold uppercase tracking-tight">{profile?.companyName ?? 'iPOS ZEN ELITE'}</h1>
                    <p className="text-xs font-medium leading-relaxed">{profile?.address || 'Adresse non configurée'}</p>
                    <p className="text-xs font-bold">Tél: <span className="font-mono">{profile?.phone || '—'}</span></p>
                    
                    {/* Algerian Tax Details */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 pt-4 border-t border-black/10 text-[9pt]">
                       {profile?.rc_number && <p className="font-mono font-bold uppercase">RC: {profile.rc_number}</p>}
                       {profile?.nif && <p className="font-mono font-bold uppercase">NIF: {profile.nif}</p>}
                       {profile?.ai_number && <p className="font-mono font-bold uppercase">AI: {profile.ai_number}</p>}
                       {profile?.nis_number && <p className="font-mono font-bold uppercase">NIS: {profile.nis_number}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <div className="border border-black px-4 py-1.5 rounded-sm mb-4 inline-block">
                        <h2 className="text-sm font-bold uppercase tracking-widest">BON DE LIVRAISON</h2>
                    </div>
                    <p className="text-xl font-mono font-bold tracking-tight mb-1">N° {sale.invoiceNumber}</p>
                    <p className="text-[10px] font-bold uppercase text-gray-500">Date : {date}</p>
                </div>
            </div>

            {/* Informations Client المبسطة */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="p-4 rounded-md border border-black flex flex-col justify-center">
                    <p className="text-[9px] font-bold uppercase text-gray-400 mb-1 tracking-widest">Destinataire / Client</p>
                    <p className="text-base font-bold tracking-tight uppercase leading-tight">{customerName || 'Client de passage'}</p>
                </div>
                
                <div className="p-4 border border-dashed border-black/20 rounded-md flex flex-col items-end justify-center">
                    <p className="text-[9px] font-bold uppercase text-gray-400 mb-0.5 tracking-widest">Nature de l'opération</p>
                    <p className="text-sm font-bold uppercase">
                        {sale.paymentStatus === 'paid' ? 'Vente au Comptant' : 'Vente à Crédit'}
                    </p>
                    {sale.dueDate && (
                        <p className="text-[10px] font-bold text-black mt-1 uppercase tracking-wide">
                            Échéance : {format(new Date(sale.dueDate), 'dd/MM/yyyy')}
                        </p>
                    )}
                </div>
            </div>

            {/* Table des Articles المبسطة */}
            <table className="w-full border-collapse mb-8 text-[9pt]">
                <thead>
                    <tr className="bg-gray-100 border-y border-black">
                        <th className="p-3 text-left font-bold uppercase tracking-wider">Designation des Produits</th>
                        <th className="p-3 text-center font-bold uppercase tracking-wider w-16">Qté</th>
                        <th className="p-3 text-right font-bold uppercase tracking-wider w-32">P.U (DA)</th>
                        <th className="p-3 text-right font-bold uppercase tracking-wider w-36">Total (DA)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 border-x border-black/5">
                    {sale.items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="p-3 font-medium uppercase leading-relaxed">{item.name}</td>
                            <td className="p-3 text-center font-bold">{item.quantity}</td>
                            <td className="p-3 text-right font-mono">{fmt(item.price)}</td>
                            <td className="p-3 text-right font-bold">{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Récapitulatif Financier Monochrome */}
            <div className="flex justify-end mb-12">
                <div className="w-80 space-y-2">
                    <div className="flex justify-between text-[10pt] font-medium text-gray-500 px-2">
                        <span className="uppercase tracking-widest">Sous-Total</span>
                        <span className="font-mono">{fmt(sale.subtotal)}</span>
                    </div>
                    
                    {safeNumber(sale.discountAmount) > 0.01 && (
                        <div className="flex justify-between text-[10pt] font-bold px-2 italic">
                            <span className="uppercase tracking-widest">Remise</span>
                            <span className="font-mono">-{fmt(safeNumber(sale.discountAmount))}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center border-t-2 border-black p-4 mt-2">
                        <span className="font-bold uppercase text-[10pt] tracking-widest">NET A PAYER</span>
                        <span className="text-xl font-bold tracking-tighter tabular-nums">{fmt(sale.total)}</span>
                    </div>

                    <div className="pt-4 mt-2 border-t border-dashed border-black/10 px-2 space-y-1 text-[10pt]">
                        <div className="flex justify-between">
                            <span className="uppercase opacity-50 italic">Versé (Reçu)</span>
                            <span className="font-bold">-{fmt(safeNumber(sale.amountPaid))}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold border-t border-black/5 pt-2 mt-2">
                            <span className="uppercase text-[8pt] tracking-widest">Solde Dû</span>
                            <span className="tracking-tighter tabular-nums">{fmt(newBalance)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Arrêté de la facture */}
            <div className="p-4 bg-gray-50 rounded-md border border-gray-200 mb-12">
                <p className="text-[8px] font-bold uppercase text-gray-400 mb-1 tracking-widest">Arrêtée la présente facture à la somme de :</p>
                <p className="text-[10pt] font-bold uppercase leading-relaxed italic">
                    {numberToFrenchWords(sale.total)}
                </p>
            </div>

            {/* Zone de Signature & Cacheت */}
            <div className="flex justify-between px-8 text-center mt-auto pt-8">
                <div className="space-y-16">
                    <p className="text-[9pt] font-bold uppercase tracking-widest opacity-40">Cachet & Signature</p>
                    <div className="h-20 w-20 mx-auto border-2 border-gray-100 rounded-full flex items-center justify-center opacity-5">
                        <span className="text-[8pt] font-bold">STAMP</span>
                    </div>
                </div>
                <div className="space-y-16">
                    <p className="text-[9pt] font-bold uppercase tracking-widest opacity-40">Accusé de Réception</p>
                    <p className="text-[9pt] italic text-gray-300 font-medium">"Bon pour accord"</p>
                </div>
            </div>

            {/* Footer المبسط */}
            <footer className="mt-16 pt-6 border-t border-gray-100 flex justify-between items-center text-[7pt] font-bold text-gray-300 uppercase tracking-widest">
                <span>iPOS ZEN v2.10 — SOVEREIGN LEDGER</span>
                <span className="font-mono">ID: {sale.uuid.substring(0,8).toUpperCase()}</span>
                <span>Original</span>
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