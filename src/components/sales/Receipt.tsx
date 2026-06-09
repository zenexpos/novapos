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
    
    const newBalance = (oldBalance + sale.total) - safeNumber(sale.amountPaid);

    return (
        <div className="thermal-receipt bg-white text-black font-mono"
            style={{ 
              fontSize: '10pt', 
              width: '76mm', 
              margin: '0 auto', 
              padding: '5mm 0mm', 
              lineHeight: 1.2
            }}>
            <div className="text-center mb-4">
                <p className="font-black text-[12pt] uppercase mb-1">{profile?.companyName ?? 'iPOS ZEN ELITE'}</p>
                {profile?.address && <p className="text-[7.5pt] leading-tight opacity-80">{profile.address}</p>}
                {profile?.phone   && <p className="text-[8.5pt] font-bold mt-1">Tél: {profile.phone}</p>}
            </div>

            <div className="border-y border-black border-dashed py-2 mb-4 text-center">
                <p className="font-black text-[11pt] uppercase tracking-tighter">BON DE LIVRAISON</p>
                <p className="text-[9pt] font-bold mt-1">#{sale.invoiceNumber}</p>
            </div>

            <div className="text-[8pt] mb-4 space-y-0.5">
                <div className="flex justify-between"><span>DATE :</span> <span className="font-bold">{date}</span></div>
                <div className="flex justify-between"><span>CLIENT :</span> <span className="font-bold">{customerName?.toUpperCase()}</span></div>
            </div>

            <table className="w-full text-[8.5pt] mb-4 border-collapse">
                <thead>
                    <tr className="border-b border-black">
                        <th className="text-left py-1">DESIGNATION</th>
                        <th className="text-center py-1 w-10">QTE</th>
                        <th className="text-right py-1 w-20">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, i) => (
                        <tr key={i} className="border-b border-black/10 border-dotted">
                            <td className="py-1.5 pr-1 font-bold uppercase leading-tight text-[8pt]">{item.name}</td>
                            <td className="text-center py-1.5 font-bold">{item.quantity}</td>
                            <td className="text-right py-1.5 font-black">{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t border-black pt-2 space-y-1">
                <div className="flex justify-between text-[8.5pt]">
                    <span>SOUS-TOTAL:</span>
                    <span className="font-bold">{fmt(sale.subtotal)}</span>
                </div>
                {safeNumber(sale.discountAmount) > 0.01 && (
                    <div className="flex justify-between text-[8.5pt] italic">
                        <span>REMISE :</span>
                        <span className="font-bold">-{fmt(safeNumber(sale.discountAmount))}</span>
                    </div>
                )}
                <div className="flex justify-between font-black text-[11pt] mt-1 border-y border-black py-1">
                    <span>NET A PAYER:</span>
                    <span>{fmt(sale.total)}</span>
                </div>
                
                <div className="flex justify-between text-[9pt] pt-1">
                    <span>REÇU (VERS.):</span>
                    <span className="font-bold">-{fmt(safeNumber(sale.amountPaid))}</span>
                </div>

                <div className="flex justify-between font-black text-[10pt] bg-black text-white px-1 py-1.5 mt-1">
                    <span>SOLDE DU :</span>
                    <span>{fmt(newBalance)} DA</span>
                </div>
            </div>

            <div className="text-center mt-8 border-t border-black border-dashed pt-4 opacity-40 text-[7pt]">
                <p className="font-bold uppercase tracking-widest">MERCI DE VOTRE VISITE</p>
                <p className="mt-1">Logiciel de gestion iPOS Zen</p>
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
    const newBalance = (oldBalance + sale.total) - safeNumber(sale.amountPaid);

    return (
        <div className="a4-receipt-wrapper bg-white text-black p-12 font-sans" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
            {/* Header المؤسساتي */}
            <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
                <div className="space-y-1.5 max-w-[65%]">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-primary">{profile?.companyName ?? 'iPOS ZEN ELITE'}</h1>
                    <p className="text-sm font-bold opacity-80 leading-relaxed">{profile?.address || 'Adresse non configurée'}</p>
                    <p className="text-sm font-bold opacity-80">Tél: <span className="font-mono">{profile?.phone || '—'}</span></p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-4 pt-4 border-t border-black/10">
                       {profile?.rc_number && <p className="text-[9.5pt] font-mono font-bold uppercase">RC: {profile.rc_number}</p>}
                       {profile?.nif && <p className="text-[9.5pt] font-mono font-bold uppercase">NIF: {profile.nif}</p>}
                       {profile?.ai_number && <p className="text-[9.5pt] font-mono font-bold uppercase">AI: {profile.ai_number}</p>}
                       {profile?.nis_number && <p className="text-[9.5pt] font-mono font-bold uppercase">NIS: {profile.nis_number}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-black text-white px-6 py-2 rounded-md mb-4 inline-block shadow-lg">
                        <h2 className="text-xl font-black uppercase tracking-widest">Facture / BL</h2>
                    </div>
                    <p className="text-2xl font-mono font-black tracking-tight mb-1">N° {sale.invoiceNumber}</p>
                    <p className="text-sm font-black uppercase text-gray-500">Date d'émission: {date}</p>
                </div>
            </div>

            {/* Informations Client */}
            <div className="grid grid-cols-2 gap-10 mb-10">
                <div className="bg-gray-50 p-6 rounded-2xl border-2 border-black/5 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Destinataire / Client</p>
                    <p className="text-2xl font-black tracking-tight uppercase">{customerName}</p>
                </div>
                
                <div className="p-6 border-2 border-dashed border-black/10 rounded-2xl flex flex-col items-end justify-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Condition de Règlement</p>
                    <p className="text-lg font-black uppercase text-primary">{sale.paymentStatus === 'paid' ? 'Vente au Comptant' : 'Vente à Crédit'}</p>
                    {sale.dueDate && (
                        <p className="text-xs font-bold text-destructive mt-1 uppercase">Échéance : {format(new Date(sale.dueDate), 'dd/MM/yyyy')}</p>
                    )}
                </div>
            </div>

            {/* Table des Articles */}
            <table className="w-full border-collapse mb-10 overflow-hidden rounded-xl">
                <thead>
                    <tr className="bg-black text-white">
                        <th className="p-4 text-left text-[10pt] font-black uppercase tracking-widest">Désignation</th>
                        <th className="p-4 text-center text-[10pt] font-black uppercase tracking-widest w-20">Qté</th>
                        <th className="p-4 text-right text-[10pt] font-black uppercase tracking-widest w-36">P.U (DA)</th>
                        <th className="p-4 text-right text-[10pt] font-black uppercase tracking-widest w-40">Total (DA)</th>
                    </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-50 border-x-2 border-black/5">
                    {sale.items.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-gray-50">
                            <td className="p-4 font-bold uppercase text-[9pt] leading-relaxed">{item.name}</td>
                            <td className="p-4 text-center font-black text-[11pt]">{item.quantity}</td>
                            <td className="p-4 text-right font-mono text-[10pt]">{fmt(item.price)}</td>
                            <td className="p-4 text-right font-black text-[11pt]">{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Récapitulatif Financier */}
            <div className="flex justify-end mb-12">
                <div className="w-[450px] space-y-3">
                    <div className="flex justify-between text-[10pt] font-bold text-gray-500 px-4">
                        <span className="uppercase tracking-widest">Sous-Total Brut</span>
                        <span className="font-mono">{fmt(sale.subtotal)} DA</span>
                    </div>
                    
                    {safeNumber(sale.discountAmount) > 0.01 && (
                        <div className="flex justify-between text-[10pt] font-black text-emerald-600 px-4">
                            <span className="uppercase tracking-widest">Remise Accordée</span>
                            <span className="font-mono">-{fmt(safeNumber(sale.discountAmount))} DA</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center bg-black text-white p-6 rounded-xl shadow-xl">
                        <span className="font-black uppercase text-[10pt] tracking-[0.2em]">Net à Payer (DA)</span>
                        <span className="text-3xl font-black tracking-tighter tabular-nums">{fmt(sale.total)}</span>
                    </div>

                    <div className="pt-6 mt-4 border-t-2 border-dashed border-gray-100 px-4 space-y-2">
                        <div className="flex justify-between text-[10pt] font-bold">
                            <span className="uppercase opacity-40 italic">Versement de ce jour</span>
                            <span className="text-emerald-600 font-black">-{fmt(safeNumber(sale.amountPaid))}</span>
                        </div>
                        <div className="flex justify-between items-center text-2xl font-black text-red-600 pt-2 border-t border-black/5 mt-2">
                            <span className="uppercase text-[9pt] tracking-[0.2em]">Solde Débiteur</span>
                            <span className="tracking-tighter tabular-nums">{fmt(newBalance)} DA</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Arrêté de la facture (C'est obligatoire en Algérie) */}
            <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mb-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                <p className="text-[9pt] font-black uppercase text-gray-400 mb-2 tracking-widest">Arrêtée la présente facture à la somme de :</p>
                <p className="text-[11pt] font-black uppercase leading-relaxed text-secondary italic">
                    {numberToFrenchWords(sale.total)}
                </p>
            </div>

            {/* Zone de Signature & Cachet */}
            <div className="flex justify-between px-12 text-center mt-auto pt-10">
                <div className="space-y-20">
                    <p className="text-[10pt] font-black uppercase tracking-[0.2em] opacity-30">Cachet & Signature Établissement</p>
                    <div className="h-24 w-24 mx-auto border-2 border-gray-100 rounded-full flex items-center justify-center opacity-5">
                        <span className="text-[9pt] font-black">STAMP</span>
                    </div>
                </div>
                <div className="space-y-20">
                    <p className="text-[10pt] font-black uppercase tracking-[0.2em] opacity-30">Accusé de Réception Client</p>
                    <p className="text-[10pt] italic text-gray-300 font-medium">"Reçu conforme à la livraison"</p>
                </div>
            </div>

            {/* Footer السيادي */}
            <footer className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center text-[8pt] font-bold text-gray-300 uppercase tracking-widest">
                <span>iPOS ZEN v2.9 — SOVEREIGN ERP SYSTEM</span>
                <span className="font-mono">SECURED-DOC-{sale.uuid.substring(0,8).toUpperCase()}</span>
                <span>Copie Originale</span>
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
