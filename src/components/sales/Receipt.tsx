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

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
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
        <div className="thermal-receipt bg-white text-black"
            style={{ 
              fontFamily: "'Courier New', Courier, monospace", 
              fontSize: '10pt', 
              width: '80mm', 
              margin: '0 auto', 
              padding: '6mm 4mm', 
              lineHeight: 1.4,
              direction: 'ltr' 
            }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '8mm' }}>
                <p style={{ fontWeight: 900, fontSize: '13pt', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {profile?.companyName ?? 'iPOS ZEN'}
                </p>
                {profile?.address && <p style={{ fontSize: '8pt', marginTop: '1.5mm' }}>{profile.address}</p>}
                {profile?.phone   && <p style={{ fontSize: '8pt' }}>Tél: {profile.phone}</p>}
            </div>

            <div style={{ borderTop: '2px solid #000', borderBottom: '1px dashed #000', padding: '2mm 0', marginBottom: '4mm', textAlign: 'center' }}>
                <p style={{ fontWeight: 900, fontSize: '11pt', textTransform: 'uppercase' }}>Bon de Livraison</p>
            </div>

            {/* Meta */}
            <div style={{ fontSize: '9pt', marginBottom: '4mm', lineHeight: 1.6 }}>
                <p><strong>Facture:</strong> {sale.invoiceNumber}</p>
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Client:</strong> {customerName ?? 'Client de passage'}</p>
            </div>

            <div style={{ borderTop: '1px dashed #000', marginBottom: '2mm' }} />

            {/* Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                <thead>
                    <tr style={{ borderBottom: '1.5px solid #000' }}>
                        <th style={{ textAlign: 'left',   padding: '2px 0', fontWeight: 900 }}>ART</th>
                        <th style={{ textAlign: 'center', padding: '2px 0', fontWeight: 900 }}>QTE</th>
                        <th style={{ textAlign: 'right',  padding: '2px 0', fontWeight: 900 }}>TOT</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px dotted #ccc' }}>
                            <td style={{ padding: '3px 0', textTransform: 'uppercase', fontWeight: 700 }}>
                                {item.name}
                                <span style={{ display: 'block', fontSize: '8pt', fontWeight: 400, opacity: 0.7 }}>
                                    {fmt(item.price)} × {item.quantity}
                                </span>
                            </td>
                            <td style={{ textAlign: 'center', padding: '3px 0', fontWeight: 700 }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right',  padding: '3px 0', fontWeight: 900 }}>{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ borderTop: '1.5px solid #000', marginTop: '4mm', marginBottom: '3mm' }} />

            {/* Totals */}
            <div style={{ fontSize: '9.5pt', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                    <span>TOTAL TTC:</span><span>{fmt(sale.total)} DA</span>
                </div>
                {Math.abs(oldBalance) > 0.01 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6, fontSize: '8.5pt' }}>
                        <span>Ancien solde:</span><span>{fmt(oldBalance)} DA</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>REÇU:</span><span>-{fmt(safeNumber(sale.amountPaid))} DA</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontWeight: 900, 
                  fontSize: '11pt', 
                  backgroundColor: '#000', 
                  color: '#fff',
                  padding: '2mm', 
                  marginTop: '3mm' 
                }}>
                    <span>NET À PAYER:</span><span>{fmt(newBalance)} DA</span>
                </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '8mm', borderTop: '1px dashed #999', paddingTop: '4mm', fontSize: '8pt' }}>
                <p style={{ fontWeight: 900 }}>MERCI DE VOTRE VISITE !</p>
                <p style={{ opacity: 0.5, marginTop: '1.5mm', fontSize: '7pt' }}>Généré par iPOS ZEN — Elite System</p>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// A4 Invoice — professional, high-density print
// ─────────────────────────────────────────────────────────────────────────────
const A4Receipt = ({ sale, profile, customerName, oldBalance = 0 }: Omit<ReceiptProps, 'receiptType'>) => {
    const fmt = (v: number) => v.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const date = sale.createdAt
        ? format(new Date(sale.createdAt), 'dd/MM/yyyy', { locale: fr })
        : format(new Date(), 'dd/MM/yyyy', { locale: fr });
    const time = sale.createdAt
        ? format(new Date(sale.createdAt), 'HH:mm', { locale: fr })
        : format(new Date(), 'HH:mm', { locale: fr });

    const newBalance = (oldBalance + sale.total) - safeNumber(sale.amountPaid);
    const totalQty = sale.items.reduce((s, i) => s + i.quantity, 0);

    const paymentLabel = sale.paymentStatus === 'paid'    ? 'COMPTANT'
                       : sale.paymentStatus === 'partial' ? 'PARTIEL'
                       : 'À CRÉDIT';

    return (
        <div className="a4-receipt-wrapper bg-white text-[#111827]"
            style={{ 
              fontFamily: "'Segoe UI', system-ui, sans-serif", 
              width: '210mm', 
              minHeight: '297mm', 
              margin: '0 auto', 
              padding: '15mm', 
              lineHeight: 1.5, 
              fontSize: '11pt' 
            }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #111827', paddingBottom: '10mm', marginBottom: '10mm' }}>
                <div>
                    <h1 style={{ fontSize: '24pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px', margin: 0 }}>
                        {profile?.companyName ?? 'iPOS ZEN'}
                    </h1>
                    <div style={{ marginTop: '4mm', fontSize: '10pt', color: '#4B5563', lineHeight: 1.8 }}>
                        {profile?.address && <p>{profile.address}{profile.city ? `, ${profile.city}` : ''}</p>}
                        {profile?.phone   && <p>Tél: {profile.phone}</p>}
                        {profile?.nif     && <p>NIF: {profile.nif} — RC: {profile.rc_number || '—'}</p>}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '22pt', fontWeight: 900, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '-0.5px', margin: 0 }}>
                        Facture
                    </h2>
                    <div style={{ marginTop: '4mm' }}>
                        <p style={{ fontSize: '14pt', fontWeight: 900, fontFamily: 'monospace' }}>#{sale.invoiceNumber}</p>
                        <p style={{ fontSize: '10pt', color: '#6B7280' }}>Date: {date} à {time}</p>
                        <span style={{ display: 'inline-block', marginTop: '3mm', padding: '1.5mm 4mm', borderRadius: '6px', fontSize: '9pt', fontWeight: 900, color: '#fff', backgroundColor: '#111827' }}>
                            {paymentLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Info blocks */}
            <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '10mm', marginBottom: '10mm' }}>
                <div style={{ backgroundColor: '#F3F4F6', borderRadius: '12px', padding: '6mm' }}>
                    <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', color: '#6B7280', marginBottom: '2mm' }}>Client</p>
                    <p style={{ fontSize: '16pt', fontWeight: 900, margin: 0 }}>{customerName ?? 'Client de passage'}</p>
                </div>
                <div style={{ border: '2px solid #E5E7EB', borderRadius: '12px', padding: '6mm' }}>
                    <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', color: '#6B7280', marginBottom: '2mm' }}>Réf. de Paiement</p>
                    <p style={{ fontSize: '12pt', fontWeight: 700, margin: 0 }}>Règlement immédiat</p>
                </div>
            </div>

            {/* Items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10mm' }}>
                <thead>
                    <tr style={{ backgroundColor: '#111827', color: '#fff' }}>
                        <th style={{ padding: '4mm', textAlign: 'left', fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase' }}>Désignation</th>
                        <th style={{ padding: '4mm', textAlign: 'center', width: '20mm', fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase' }}>Qté</th>
                        <th style={{ padding: '4mm', textAlign: 'right',  width: '35mm', fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase' }}>P.U (DA)</th>
                        <th style={{ padding: '4mm', textAlign: 'right',  width: '40mm', fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase' }}>Total (DA)</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <td style={{ padding: '4mm', fontWeight: 700, textTransform: 'uppercase' }}>{item.name}</td>
                            <td style={{ padding: '4mm', textAlign: 'center', fontWeight: 900 }}>{item.quantity}</td>
                            <td style={{ padding: '4mm', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(item.price)}</td>
                            <td style={{ padding: '4mm', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900 }}>{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals block */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '90mm', spaceY: '4mm' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0' }}>
                        <span style={{ color: '#6B7280' }}>Sous-total:</span>
                        <span style={{ fontWeight: 700 }}>{fmt(sale.subtotal)} DA</span>
                    </div>
                    {safeNumber(sale.discountAmount) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', color: '#DC2626' }}>
                            <span>Remise:</span>
                            <span style={{ fontWeight: 700 }}>-{fmt(safeNumber(sale.discountAmount))} DA</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4mm 0', borderTop: '2px solid #111827', fontSize: '13pt', fontWeight: 900 }}>
                        <span>TOTAL NET:</span>
                        <span>{fmt(sale.total)} DA</span>
                    </div>
                    {Math.abs(oldBalance) > 0.01 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', color: '#6B7280', fontSize: '10pt' }}>
                          <span>Solde précédent:</span>
                          <span>{fmt(oldBalance)} DA</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', color: '#059669', fontSize: '11pt', fontWeight: 700 }}>
                        <span>Paiement reçu:</span>
                        <span>-{fmt(safeNumber(sale.amountPaid))} DA</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '5mm', 
                      marginTop: '4mm',
                      backgroundColor: '#111827', 
                      color: '#fff', 
                      borderRadius: '8px',
                      fontSize: '16pt', 
                      fontWeight: 900 
                    }}>
                        <span>À PAYER:</span>
                        <span>{fmt(newBalance)} DA</span>
                    </div>
                </div>
            </div>

            {/* Footer with number to words */}
            <div style={{ marginTop: '15mm', padding: '6mm', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '2mm' }}>
                    Arrêtée la présente facture à la somme de :
                </p>
                <p style={{ fontSize: '10pt', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
                    {numberToWordsFR(sale.total)}
                </p>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '10mm', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#9CA3AF', fontWeight: 700 }}>
                <span>iPOS ZEN v2.9 — Logiciel de Gestion Souverain</span>
                <span>Fait à {profile?.city || 'Alger'} le {date}</span>
            </div>
        </div>
    );
};

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
    ({ sale, profile, receiptType, customerName, oldBalance = 0 }, ref) => {
        const props = { sale, profile, customerName, oldBalance };
        return (
            <div ref={ref} className="print:m-0">
                {receiptType === 'thermal' ? <ThermalReceipt {...props} /> : <A4Receipt {...props} />}
            </div>
        );
    }
);

Receipt.displayName = 'Receipt';
