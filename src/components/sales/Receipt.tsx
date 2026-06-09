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
// Thermal receipt — 80mm monochrome optimized
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
              fontFamily: "monospace", 
              fontSize: '10pt', 
              width: '80mm', 
              margin: '0 auto', 
              padding: '8mm 4mm', 
              lineHeight: 1.3
            }}>
            <div style={{ textAlign: 'center', marginBottom: '6mm' }}>
                <p style={{ fontWeight: 900, fontSize: '14pt', textTransform: 'uppercase' }}>
                    {profile?.companyName ?? 'iPOS ZEN'}
                </p>
                {profile?.address && <p style={{ fontSize: '8pt', marginTop: '1mm' }}>{profile.address}</p>}
                {profile?.phone   && <p style={{ fontSize: '8pt' }}>Tél: {profile.phone}</p>}
            </div>

            <div style={{ borderTop: '2px solid #000', borderBottom: '1px dashed #000', padding: '2mm 0', marginBottom: '4mm', textAlign: 'center' }}>
                <p style={{ fontWeight: 900, fontSize: '11pt', textTransform: 'uppercase' }}>Bon de Livraison</p>
            </div>

            <div style={{ fontSize: '9pt', marginBottom: '4mm' }}>
                <p><strong>N°:</strong> {sale.invoiceNumber}</p>
                <p><strong>Le:</strong> {date}</p>
                <p><strong>Client:</strong> {customerName}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                <thead>
                    <tr style={{ borderBottom: '1.5px solid #000' }}>
                        <th style={{ textAlign: 'left', padding: '2px 0' }}>ART</th>
                        <th style={{ textAlign: 'center', padding: '2px 0' }}>QTE</th>
                        <th style={{ textAlign: 'right', padding: '2px 0' }}>TOT</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px dotted #ccc' }}>
                            <td style={{ padding: '3px 0', textTransform: 'uppercase', fontWeight: 700 }}>{item.name}</td>
                            <td style={{ textAlign: 'center', padding: '3px 0' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '3px 0', fontWeight: 900 }}>{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ borderTop: '1.5px solid #000', marginTop: '4mm', paddingTop: '2mm' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '11pt' }}>
                    <span>TOTAL:</span><span>{fmt(sale.total)} DA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', marginTop: '1mm' }}>
                    <span>Versé:</span><span>{fmt(safeNumber(sale.amountPaid))} DA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '11pt', backgroundColor: '#000', color: '#fff', padding: '1mm 2mm', marginTop: '2mm' }}>
                    <span>À PAYER:</span><span>{fmt(newBalance)} DA</span>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '8mm', borderTop: '1px dashed #000', paddingTop: '4mm', fontSize: '8pt', opacity: 0.5 }}>
                <p>MERCI DE VOTRE VISITE</p>
                <p>iPOS ZEN ELITE</p>
            </div>
        </div>
    );
};

const A4Receipt = ({ sale, profile, customerName, oldBalance = 0 }: Omit<ReceiptProps, 'receiptType'>) => {
    const fmt = (v: number) => v.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const date = sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy');
    const newBalance = (oldBalance + sale.total) - safeNumber(sale.amountPaid);

    return (
        <div className="a4-receipt-wrapper bg-white text-black p-12 break-avoid" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
            <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">{profile?.companyName ?? 'iPOS ZEN'}</h1>
                    <p className="text-sm font-bold opacity-70">{profile?.address}</p>
                    <p className="text-sm font-bold opacity-70">Tél: {profile?.phone}</p>
                    {profile?.nif && <p className="text-xs font-mono mt-2">NIF: {profile.nif} | RC: {profile.rc_number}</p>}
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-black text-primary uppercase mb-2">Facture</h2>
                    <p className="text-xl font-mono font-black">#{sale.invoiceNumber}</p>
                    <p className="text-sm font-bold uppercase text-gray-500">Date: {date}</p>
                </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-2xl mb-10 border-l-8 border-black">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Destinataire</p>
                <p className="text-2xl font-black">{customerName}</p>
            </div>

            <table className="w-full border-collapse mb-10">
                <thead>
                    <tr className="bg-black text-white">
                        <th className="p-4 text-left text-xs font-black uppercase">Désignation</th>
                        <th className="p-4 text-center text-xs font-black uppercase w-20">Qté</th>
                        <th className="p-4 text-right text-xs font-black uppercase w-32">P.U (DA)</th>
                        <th className="p-4 text-right text-xs font-black uppercase w-40">Total (DA)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sale.items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="p-4 font-bold uppercase text-sm">{item.name}</td>
                            <td className="p-4 text-center font-black">{item.quantity}</td>
                            <td className="p-4 text-right font-mono">{fmt(item.price)}</td>
                            <td className="p-4 text-right font-black">{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mb-10">
                <div className="w-96 space-y-3">
                    <div className="flex justify-between text-sm font-bold text-gray-500">
                        <span>SOUS-TOTAL:</span><span>{fmt(sale.subtotal)} DA</span>
                    </div>
                    {safeNumber(sale.discountAmount) > 0 && (
                        <div className="flex justify-between text-sm font-bold text-red-500">
                            <span>REMISE:</span><span>-{fmt(safeNumber(sale.discountAmount))} DA</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center bg-black text-white p-4 rounded-xl">
                        <span className="font-black uppercase text-xs">Total Net TTC</span>
                        <span className="text-2xl font-black tracking-tighter">{fmt(sale.total)} DA</span>
                    </div>
                    <div className="pt-4 border-t border-dashed border-gray-300">
                        <div className="flex justify-between text-sm font-bold text-emerald-600">
                            <span>VERSÉ CE JOUR:</span><span>-{fmt(safeNumber(sale.amountPaid))} DA</span>
                        </div>
                        <div className="flex justify-between text-lg font-black mt-2 text-red-600">
                            <span>SOLDE À PAYER:</span><span>{fmt(newBalance)} DA</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 italic text-sm mb-10">
                Arrêtée la présente facture à la somme de : <br/>
                <span className="font-black uppercase">{numberToWordsFR(sale.total)}</span>
            </div>

            <div className="mt-auto pt-10 border-t border-gray-100 flex justify-between text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                <span>iPOS ZEN v2.9 — Logiciel de Gestion Souverain</span>
                <span>Document original</span>
            </div>
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
