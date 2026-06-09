'use client';

import React from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, formatCurrency, safeNumber } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// numberToWordsFR — Convertit un montant numérique en lettres (Dinars algériens)
// ─────────────────────────────────────────────────────────────────────────────
function numberToWordsFR(n: number): string {
    const intPart = Math.floor(Math.abs(n));
    const decPart = Math.round((Math.abs(n) - intPart) * 100);
    const units = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
    const tens  = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGT', 'QUATRE-VINGT-DIX'];
    const teens = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];

    function convertGroup(num: number, isMille = false): string {
        let res = '';
        if (num >= 100) {
            const c = Math.floor(num / 100);
            const r = num % 100;
            res += c === 1 ? 'CENT ' : `${units[c]} CENT${r === 0 && !isMille ? 'S ' : ' '}`;
            num = r;
        }
        if (num >= 20) {
            const t = Math.floor(num / 10), u = num % 10;
            if (t === 7 || t === 9) {
                const pfx = t === 7 ? 'SOIXANTE' : 'QUATRE-VINGT';
                res += u === 1 && t === 7 ? `${pfx} ET ONZE` : `${pfx}-${teens[u]}`;
            } else {
                if (u === 1) res += `${tens[t]}${t === 8 ? '-UN' : ' ET UN'}`;
                else if (u > 1) res += `${tens[t]}-${units[u]}`;
                else res += `${tens[t]}${t === 8 && !isMille ? 'S' : ''}`;
            }
        } else if (num >= 10) {
            res += teens[num - 10];
        } else if (num > 0) {
            if (!(num === 1 && isMille)) res += units[num];
        }
        return res.trim();
    }

    function getWords(amount: number): string {
        if (amount === 0) return '';
        let res = '';
        const M = Math.floor(amount / 1_000_000);
        const K = Math.floor((amount % 1_000_000) / 1_000);
        const R = amount % 1_000;
        if (M > 0) res += `${convertGroup(M)} MILLION${M > 1 ? 'S ' : ' '}`;
        if (K > 0) res += K === 1 ? 'MILLE ' : `${convertGroup(K, true)} MILLE `;
        if (R > 0) res += convertGroup(R);
        return res.trim();
    }

    if (intPart === 0 && decPart === 0) return 'ZÉRO DINAR';
    let str = n < 0 ? 'MOINS ' : '';
    if (intPart > 0) str += `${getWords(intPart)} ${intPart > 1 ? 'DINARS' : 'DINAR'}`;
    if (decPart > 0) {
        if (intPart > 0) str += ' ET ';
        str += `${convertGroup(decPart)} ${decPart > 1 ? 'CENTIMES' : 'CENTIME'}`;
    }
    return str.trim().toUpperCase();
}

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
        <div className="thermal-receipt bg-white text-black break-avoid"
            style={{ 
              fontFamily: "'Courier New', Courier, monospace", 
              fontSize: '10pt', 
              width: '80mm', 
              margin: '0 auto', 
              padding: '10mm 4mm', 
              lineHeight: 1.2
            }}>
            <div style={{ textAlign: 'center', marginBottom: '6mm' }}>
                <p style={{ fontWeight: 900, fontSize: '14pt', textTransform: 'uppercase', marginBottom: '1mm' }}>
                    {profile?.companyName ?? 'iPOS ZEN ELITE'}
                </p>
                {profile?.address && <p style={{ fontSize: '8pt', opacity: 0.8 }}>{profile.address}</p>}
                {profile?.phone   && <p style={{ fontSize: '9pt', fontWeight: 'bold' }}>Tél: {profile.phone}</p>}
            </div>

            <div style={{ borderTop: '2px solid #000', borderBottom: '1.5px dashed #000', padding: '3mm 0', marginBottom: '4mm', textAlign: 'center' }}>
                <p style={{ fontWeight: 900, fontSize: '11pt', textTransform: 'uppercase' }}>Bon de Livraison</p>
                <p style={{ fontSize: '9pt', fontWeight: 'bold', marginTop: '1mm' }}>#{sale.invoiceNumber}</p>
            </div>

            <div style={{ fontSize: '9pt', marginBottom: '4mm', borderLeft: '3px solid #000', paddingLeft: '2mm' }}>
                <p><strong>Date :</strong> {date}</p>
                <p><strong>Client :</strong> {customerName}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '4mm' }}>
                <thead>
                    <tr style={{ borderBottom: '1.5px solid #000' }}>
                        <th style={{ textAlign: 'left', padding: '3px 0' }}>DESIGNATION</th>
                        <th style={{ textAlign: 'center', padding: '3px 0', width: '35px' }}>QTE</th>
                        <th style={{ textAlign: 'right', padding: '3px 0', width: '70px' }}>TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px dotted #888' }}>
                            <td style={{ padding: '4px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>{item.name}</td>
                            <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 'bold' }}>{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ borderTop: '2px solid #000', marginTop: '3mm', paddingTop: '3mm' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '11pt', marginBottom: '1mm' }}>
                    <span>TOTAL FACTURE:</span>
                    <span>{fmt(sale.total)}</span>
                </div>
                
                {safeNumber(sale.amountPaid) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5pt', marginBottom: '1mm' }}>
                        <span>VERSEMENT :</span>
                        <span>-{fmt(safeNumber(sale.amountPaid))}</span>
                    </div>
                )}

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontWeight: 900, 
                    fontSize: '11pt', 
                    backgroundColor: '#000', 
                    color: '#fff', 
                    padding: '2mm 3mm', 
                    marginTop: '2mm',
                    borderRadius: '1mm'
                }}>
                    <span>SOLDE DU :</span>
                    <span>{fmt(newBalance)} DA</span>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '8mm', borderTop: '1px dashed #000', paddingTop: '4mm', fontSize: '7.5pt' }}>
                <p style={{ fontWeight: 'bold', letterSpacing: '1px' }}>MERCI DE VOTRE CONFIANCE</p>
                <p style={{ opacity: 0.4, marginTop: '1mm' }}>Logiciel السيادي iPOS Zen</p>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// A4 Receipt — Professional Institutional Layout
// ─────────────────────────────────────────────────────────────────────────────
const A4Receipt = ({ sale, profile, customerName, oldBalance = 0 }: Omit<ReceiptProps, 'receiptType'>) => {
    const fmt = (v: number) => v.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const date = sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy');
    const newBalance = (oldBalance + sale.total) - safeNumber(sale.amountPaid);

    return (
        <div className="a4-receipt-wrapper bg-white text-black p-12 break-avoid shadow-none" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', boxSizing: 'border-box' }}>
            {/* Header المؤسساتي */}
            <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
                <div className="space-y-1.5">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-primary">{profile?.companyName ?? 'iPOS ZEN ELITE'}</h1>
                    <p className="text-sm font-bold opacity-80">{profile?.address}</p>
                    <p className="text-sm font-bold opacity-80">Tél: <span className="font-mono">{profile?.phone}</span></p>
                    <div className="flex gap-4 mt-2 pt-2 border-t border-black/5">
                       {profile?.nif && <p className="text-[10px] font-mono font-bold">NIF: {profile.nif}</p>}
                       {profile?.rc_number && <p className="text-[10px] font-mono font-bold">RC: {profile.rc_number}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-black text-white px-6 py-2 rounded-lg mb-3 inline-block">
                        <h2 className="text-xl font-black uppercase tracking-widest">Facture / BL</h2>
                    </div>
                    <p className="text-2xl font-mono font-black tracking-tight">N° {sale.invoiceNumber}</p>
                    <p className="text-sm font-bold uppercase text-gray-500 mt-1">Date: {date}</p>
                </div>
            </div>

            {/* Informations Client */}
            <div className="grid grid-cols-2 gap-10 mb-10">
                <div className="bg-gray-50 p-6 rounded-2xl border-2 border-black/5 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Destinataire / Client</p>
                    <p className="text-2xl font-black tracking-tight">{customerName}</p>
                </div>
                
                <div className="p-6 border-2 border-dashed border-black/10 rounded-2xl flex flex-col items-end justify-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5 tracking-widest">Condition de Règlement</p>
                    <p className="text-lg font-black uppercase">{sale.paymentStatus === 'paid' ? 'Au Comptant' : 'À Crédit'}</p>
                    {sale.dueDate && (
                        <p className="text-xs font-bold text-destructive mt-1 uppercase">Échéance : {format(new Date(sale.dueDate), 'dd/MM/yyyy')}</p>
                    )}
                </div>
            </div>

            {/* Table des Articles */}
            <table className="w-full border-collapse mb-10">
                <thead>
                    <tr className="bg-black text-white">
                        <th className="p-4 text-left text-xs font-black uppercase tracking-widest rounded-l-lg">Désignation</th>
                        <th className="p-4 text-center text-xs font-black uppercase tracking-widest w-20">Qté</th>
                        <th className="p-4 text-right text-xs font-black uppercase tracking-widest w-36">P.U (DA)</th>
                        <th className="p-4 text-right text-xs font-black uppercase tracking-widest w-40 rounded-r-lg">Total (DA)</th>
                    </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-50">
                    {sale.items.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-bold uppercase text-xs">{item.name}</td>
                            <td className="p-4 text-center font-black text-sm">{item.quantity}</td>
                            <td className="p-4 text-right font-mono text-xs">{fmt(item.price)}</td>
                            <td className="p-4 text-right font-black text-sm">{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Récapitulatif Financier */}
            <div className="flex justify-end mb-12">
                <div className="w-[400px] space-y-3">
                    <div className="flex justify-between text-xs font-bold text-gray-500 px-3">
                        <span className="uppercase tracking-widest">Sous-Total</span>
                        <span className="font-mono">{fmt(sale.subtotal)} DA</span>
                    </div>
                    
                    {safeNumber(sale.discountAmount) > 0.01 && (
                        <div className="flex justify-between text-xs font-black text-emerald-600 px-3">
                            <span className="uppercase tracking-widest">Remise</span>
                            <span className="font-mono">-{fmt(safeNumber(sale.discountAmount))} DA</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center bg-black text-white p-5 rounded-xl shadow-lg">
                        <span className="font-black uppercase text-[10px] tracking-widest">Total Net à Payer</span>
                        <span className="text-2xl font-black tracking-tighter tabular-nums">{fmt(sale.total)} DA</span>
                    </div>

                    <div className="pt-4 mt-3 border-t-2 border-dashed border-gray-100 px-3 space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="uppercase opacity-50">Versé</span>
                            <span className="text-emerald-600 font-black">-{fmt(safeNumber(sale.amountPaid))} DA</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-black text-red-600 pt-1">
                            <span className="uppercase text-[9px] tracking-widest">Nouveau Solde</span>
                            <span className="tracking-tighter tabular-nums">{fmt(newBalance)} DA</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Arrêté de la facture */}
            <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mb-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                <p className="text-[9px] font-black uppercase text-gray-400 mb-2 tracking-widest">Arrêtée la présente facture à la somme de :</p>
                <p className="text-sm font-black uppercase leading-relaxed text-secondary italic">
                    {numberToWordsFR(sale.total)}
                </p>
            </div>

            {/* Signatures */}
            <div className="flex justify-between px-8 text-center">
                <div className="space-y-16">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Cachet & Signature Établissement</p>
                    <div className="h-24 w-24 mx-auto border-2 border-gray-100 rounded-full flex items-center justify-center opacity-5">
                        <span className="text-[10px] font-black">STAMP</span>
                    </div>
                </div>
                <div className="space-y-16">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Accusé de Réception Client</p>
                    <p className="text-[10px] italic text-gray-300 font-medium">"Bon pour accord et réception"</p>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-auto pt-10 border-t border-gray-100 flex justify-between items-center text-[8px] font-bold text-gray-200 uppercase tracking-widest">
                <span>iPOS ZEN v2.9 — SOVEREIGN LEDGER SYSTEM</span>
                <span>Document Original</span>
            </footer>
        </div>
    );
};

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
    ({ sale, profile, receiptType, customerName, oldBalance = 0 }, ref) => {
        const props = { sale, profile, customerName, oldBalance };
        return (
            <div ref={ref} className="print-area">
                {receiptType === 'thermal' ? <ThermalReceipt {...props} /> : <A4Receipt {...props} />}
            </div>
        );
    }
);

Receipt.displayName = 'Receipt';