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
// Thermal receipt — 80mm monochrome
// ─────────────────────────────────────────────────────────────────────────────
const ThermalReceipt = ({ sale, profile, customerName, oldBalance = 0 }: Omit<ReceiptProps, 'receiptType'>) => {
    const fmt = (v: number) => v.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const date = sale.createdAt
        ? format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })
        : format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
    const newBalance = (oldBalance + sale.total) - safeNumber(sale.amountPaid);

    return (
        <div className="thermal-receipt bg-white text-black"
            style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '9pt', width: '80mm', margin: '0 auto', padding: '4mm 3mm', lineHeight: 1.4 }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '6mm' }}>
                <p style={{ fontWeight: 900, fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {profile?.companyName ?? 'iPOS ZEN'}
                </p>
                {profile?.address && <p style={{ fontSize: '7.5pt', marginTop: '1mm' }}>{profile.address}</p>}
                {profile?.phone   && <p style={{ fontSize: '7.5pt' }}>Tél: {profile.phone}</p>}
                {profile?.rc_number && <p style={{ fontSize: '7pt' }}>RC: {profile.rc_number}</p>}
                {profile?.nif      && <p style={{ fontSize: '7pt' }}>NIF: {profile.nif}</p>}
            </div>

            <div style={{ borderTop: '2px solid #000', borderBottom: '1px dashed #000', padding: '2mm 0', marginBottom: '3mm', textAlign: 'center' }}>
                <p style={{ fontWeight: 900, fontSize: '10pt', textTransform: 'uppercase' }}>Bon de Livraison</p>
            </div>

            {/* Meta */}
            <div style={{ fontSize: '8pt', marginBottom: '3mm', lineHeight: 1.6 }}>
                <p><strong>N° Facture:</strong> {sale.invoiceNumber}</p>
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Client:</strong> {customerName ?? 'Client de passage'}</p>
                <p><strong>Paiement:</strong> {sale.paymentStatus === 'paid' ? 'COMPTANT' : sale.paymentStatus === 'partial' ? 'PARTIEL' : 'À CRÉDIT'}</p>
            </div>

            <div style={{ borderTop: '1px dashed #000', marginBottom: '2mm' }} />

            {/* Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ textAlign: 'left',   padding: '1px 2px', fontWeight: 900 }}>DÉSIGNATION</th>
                        <th style={{ textAlign: 'center', padding: '1px 2px', fontWeight: 900 }}>QTÉ</th>
                        <th style={{ textAlign: 'right',  padding: '1px 2px', fontWeight: 900 }}>TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px dotted #ccc' }}>
                            <td style={{ padding: '2px', textTransform: 'uppercase', fontWeight: 700, fontSize: '7.5pt' }}>
                                {item.name}
                                <span style={{ display: 'block', fontSize: '7pt', fontWeight: 400, opacity: 0.6 }}>
                                    {fmt(item.price)} DA × {item.quantity}
                                </span>
                            </td>
                            <td style={{ textAlign: 'center', padding: '2px', fontWeight: 700 }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right',  padding: '2px', fontWeight: 900 }}>
                                {fmt(item.price * item.quantity)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ borderTop: '2px solid #000', marginTop: '3mm', marginBottom: '2mm' }} />

            {/* Totals */}
            <div style={{ fontSize: '8.5pt', lineHeight: 1.8 }}>
                {safeNumber(sale.discountAmount) > 0 && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Sous-total:</span><span style={{ fontWeight: 700 }}>{fmt(sale.subtotal)} DA</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Remise:</span><span style={{ fontWeight: 700 }}>-{fmt(safeNumber(sale.discountAmount))} DA</span>
                        </div>
                    </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '9pt' }}>
                    <span>TOTAL FACTURE:</span><span>{fmt(sale.total)} DA</span>
                </div>
                {Math.abs(oldBalance) > 0.01 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                        <span>Ancien solde:</span><span>{fmt(oldBalance)} DA</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 900 }}>
                    <span>VERSEMENT REÇU:</span><span>-{fmt(safeNumber(sale.amountPaid))} DA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '10pt', border: '2px solid #000', padding: '2mm', marginTop: '2mm' }}>
                    <span>NET À PAYER:</span><span>{fmt(newBalance)} DA</span>
                </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '6mm', borderTop: '1px dashed #999', paddingTop: '3mm', fontSize: '7.5pt' }}>
                <p style={{ fontWeight: 900, textTransform: 'uppercase' }}>Merci de votre confiance !</p>
                <p style={{ opacity: 0.4, marginTop: '1mm', fontSize: '6.5pt' }}>iPOS ZEN — Système de caisse intelligent</p>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// A4 Invoice — professional, print-ready
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

    const paymentColor = sale.paymentStatus === 'paid'    ? '#166534'
                       : sale.paymentStatus === 'partial' ? '#92400E'
                       : '#991B1B';

    return (
        <div className="a4-receipt-wrapper bg-white text-[#111827]"
            style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '12mm 14mm', letterSpacing: 'normal', lineHeight: 1.5, fontSize: '11pt' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #111827', paddingBottom: '8mm', marginBottom: '8mm' }}>
                <div>
                    <h1 style={{ fontSize: '22pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', margin: 0 }}>
                        {profile?.companyName ?? 'Entreprise'}
                    </h1>
                    <div style={{ marginTop: '3mm', fontSize: '9pt', color: '#6B7280', lineHeight: 1.8 }}>
                        {profile?.address  && <p>{profile.address}{profile.city ? `, ${profile.city}` : ''}</p>}
                        {profile?.phone    && <p>Tél: {profile.phone}</p>}
                        {profile?.email    && <p>Email: {profile.email}</p>}
                        {profile?.rc_number && <p>RC: {profile.rc_number}</p>}
                        {profile?.nif      && <p>NIF: {profile.nif} — NIS: {profile.nis_number ?? '—'}</p>}
                        {profile?.tva_number && <p>N° TVA: {profile.tva_number}</p>}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '20pt', fontWeight: 900, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '-0.5px', margin: 0 }}>
                        Bon de Livraison
                    </h2>
                    <div style={{ marginTop: '3mm', textAlign: 'right' }}>
                        <p style={{ fontSize: '13pt', fontWeight: 900, fontFamily: 'monospace' }}>
                            N° {sale.invoiceNumber}
                        </p>
                        <p style={{ fontSize: '9pt', color: '#6B7280', fontWeight: 700 }}>
                            Émis le {date} à {time}
                        </p>
                        <span style={{ display: 'inline-block', marginTop: '2mm', padding: '1mm 3mm', borderRadius: '4px', fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', color: '#fff', backgroundColor: paymentColor }}>
                            {paymentLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Client block ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '6mm', marginBottom: '8mm' }}>
                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '5mm' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#3B82F6', marginBottom: '2mm' }}>
                        Destinataire / Client
                    </p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, margin: 0 }}>
                        {customerName ?? 'Client de passage'}
                    </p>
                </div>
                {sale.dueDate && (
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '5mm', backgroundColor: '#FFFBEB' }}>
                        <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#D97706', marginBottom: '2mm' }}>
                            Échéance
                        </p>
                        <p style={{ fontSize: '12pt', fontWeight: 900, margin: 0, color: '#92400E' }}>
                            {format(new Date(sale.dueDate), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Items table ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8mm' }}>
                <thead>
                    <tr style={{ backgroundColor: '#111827', color: '#fff' }}>
                        <th style={{ padding: '3mm 4mm', textAlign: 'center', width: '8mm', fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase' }}>N°</th>
                        <th style={{ padding: '3mm 4mm', textAlign: 'left', fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase' }}>Désignation</th>
                        <th style={{ padding: '3mm 4mm', textAlign: 'center', width: '18mm', fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase' }}>Qté</th>
                        <th style={{ padding: '3mm 4mm', textAlign: 'right',  width: '28mm', fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase' }}>P.U (DA)</th>
                        <th style={{ padding: '3mm 4mm', textAlign: 'right',  width: '28mm', fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase' }}>Total (DA)</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, idx) => (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#F9FAFB', pageBreakInside: 'avoid' }}>
                            <td style={{ padding: '2.5mm 4mm', textAlign: 'center', fontFamily: 'monospace', fontSize: '9pt', color: '#9CA3AF', borderBottom: '1px solid #E5E7EB' }}>
                                {idx + 1}
                            </td>
                            <td style={{ padding: '2.5mm 4mm', fontWeight: 700, textTransform: 'uppercase', fontSize: '9pt', borderBottom: '1px solid #E5E7EB' }}>
                                {item.name}
                            </td>
                            <td style={{ padding: '2.5mm 4mm', textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: '10pt', borderBottom: '1px solid #E5E7EB' }}>
                                {item.quantity}
                            </td>
                            <td style={{ padding: '2.5mm 4mm', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '9pt', borderBottom: '1px solid #E5E7EB' }}>
                                {fmt(item.price)}
                            </td>
                            <td style={{ padding: '2.5mm 4mm', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: '9pt', borderBottom: '1px solid #E5E7EB' }}>
                                {fmt(item.price * item.quantity)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: '#F3F4F6', borderTop: '2px solid #111827' }}>
                        <td colSpan={2} style={{ padding: '3mm 4mm', fontWeight: 900, fontSize: '9pt', textTransform: 'uppercase' }}>
                            Total général — {totalQty} article{totalQty > 1 ? 's' : ''}
                        </td>
                        <td style={{ padding: '3mm 4mm', textAlign: 'center', fontWeight: 900 }}>{totalQty}</td>
                        <td />
                        <td style={{ padding: '3mm 4mm', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: '11pt' }}>
                            {fmt(sale.subtotal)}
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* ── Footer totals ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '8mm' }}>
                {/* Amount in words */}
                <div>
                    <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '5mm' }}>
                        <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '2mm', letterSpacing: '1px' }}>
                            Arrêté la présente facture à la somme de :
                        </p>
                        <p style={{ fontSize: '9pt', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1.6 }}>
                            {numberToWordsFR(sale.total)}
                        </p>
                    </div>
                    {/* Signatures */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10mm', paddingTop: '5mm', borderTop: '1px dashed #D1D5DB' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '12mm' }}>Visa Établissement</p>
                            <div style={{ width: '40mm', height: '0.5px', backgroundColor: '#111827' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '12mm' }}>Signature Client</p>
                            <div style={{ width: '40mm', height: '0.5px', backgroundColor: '#111827' }} />
                        </div>
                    </div>
                </div>

                {/* Amounts summary */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                    {safeNumber(sale.discountAmount) > 0 && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3mm 5mm', fontSize: '9pt', borderBottom: '1px solid #F3F4F6' }}>
                                <span style={{ color: '#6B7280' }}>Sous-total</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmt(sale.subtotal)} DA</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3mm 5mm', fontSize: '9pt', borderBottom: '1px solid #F3F4F6', color: '#DC2626' }}>
                                <span>Remise ({sale.discountType === 'percentage' ? `${sale.discountAmount}%` : 'fixe'})</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>-{fmt(safeNumber(sale.discountAmount))} DA</span>
                            </div>
                        </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3mm 5mm', fontSize: '10pt', fontWeight: 900, borderBottom: '1px solid #F3F4F6' }}>
                        <span>Montant Facture</span>
                        <span style={{ fontFamily: 'monospace' }}>{fmt(sale.total)} DA</span>
                    </div>
                    {Math.abs(oldBalance) > 0.01 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3mm 5mm', fontSize: '9pt', color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
                            <span>Ancien solde</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmt(oldBalance)} DA</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3mm 5mm', fontSize: '9pt', fontWeight: 700, color: '#166534', backgroundColor: '#F0FDF4', borderBottom: '1px solid #F3F4F6' }}>
                        <span>Versement / Paiement reçu</span>
                        <span style={{ fontFamily: 'monospace' }}>-{fmt(safeNumber(sale.amountPaid))} DA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4mm 5mm', fontSize: '14pt', fontWeight: 900, backgroundColor: '#111827', color: '#fff' }}>
                        <span>NET À PAYER</span>
                        <span style={{ fontFamily: 'monospace' }}>{fmt(newBalance)} DA</span>
                    </div>
                </div>
            </div>

            {/* ── Document footer ── */}
            <div style={{ marginTop: '10mm', paddingTop: '4mm', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: '#D1D5DB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                <span>{profile?.companyName ?? ''} — iPOS ZEN v2</span>
                <span>Généré le {format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}</span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
    ({ sale, profile, receiptType, customerName, oldBalance = 0 }, ref) => {
        const props = { sale, profile, customerName, oldBalance };
        return (
            <div ref={ref}>
                {receiptType === 'thermal'
                    ? <ThermalReceipt {...props} />
                    : <A4Receipt {...props} />
                }
            </div>
        );
    }
);

Receipt.displayName = 'Receipt';
