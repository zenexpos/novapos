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

const ThermalReceipt = ({ sale, profile, customerName, oldBalance = 0 }: Omit<ReceiptProps, 'receiptType'>) => {
    const fmt = (v: number) => v.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const date = sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }) : format(new Date(), 'dd/MM/yyyy HH:mm');
    const newBalance = oldBalance + Math.max(0, sale.total - sale.amountPaid);

    return (
        <div className="thermal-receipt bg-white text-black font-mono text-[9.5pt] leading-tight p-2" style={{ width: '72mm' }}>
            <div className="text-center mb-4">
                <p className="font-bold text-[12pt] uppercase">{profile?.companyName || 'iPOS ZEN'}</p>
                <p className="text-[8pt]">{profile?.address}</p>
                <p className="text-[9pt] font-bold">Tél: {profile?.phone}</p>
            </div>
            <div className="border-y border-black border-dashed py-2 mb-4 text-center">
                <p className="font-bold">BON DE LIVRAISON #{sale.invoiceNumber}</p>
            </div>
            <div className="text-[8pt] space-y-1 mb-4">
                <div className="flex justify-between"><span>DATE:</span> <span className="font-bold">{date}</span></div>
                <div className="flex justify-between"><span>CLIENT:</span> <span className="font-bold truncate max-w-[45mm]">{customerName?.toUpperCase() || 'PASSAGE'}</span></div>
            </div>
            <table className="w-full text-[8.5pt] mb-4 border-collapse">
                <thead><tr className="border-b border-black"><th className="text-left py-1">DES.</th><th className="text-center w-8">QTÉ</th><th className="text-right w-16">TOT</th></tr></thead>
                <tbody>
                    {sale.items.map((item, i) => (
                        <tr key={i} className="border-b border-black/10 border-dotted">
                            <td className="py-2 pr-1 font-bold uppercase truncate max-w-[35mm]">{item.name}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-right font-bold">{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="border-t border-black pt-2 space-y-1 text-[9pt]">
                <div className="flex justify-between"><span>NET À PAYER:</span> <span className="font-bold">{fmt(sale.total)}</span></div>
                <div className="flex justify-between"><span>REÇU:</span> <span>{fmt(safeNumber(sale.amountPaid))}</span></div>
                <div className="flex justify-between font-bold border-t border-black pt-1"><span>SOLDE DÛ:</span> <span>{fmt(newBalance)} DA</span></div>
            </div>
            <p className="text-center mt-8 text-[7pt] uppercase opacity-40">Merci de votre confiance</p>
        </div>
    );
};

const A4Receipt = ({ sale, profile, customerName, oldBalance = 0 }: Omit<ReceiptProps, 'receiptType'>) => {
    const fmt = (v: number) => v.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const date = sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy');
    const newBalance = oldBalance + Math.max(0, sale.total - sale.amountPaid);

    return (
        <div className="a4-receipt bg-white text-black font-sans text-[9pt] leading-normal" style={{ width: '210mm', padding: '15mm' }}>
            <div className="flex justify-between border-b-2 border-black pb-4 mb-6">
                <div className="max-w-[60%]">
                    <h1 className="text-lg font-bold uppercase">{profile?.companyName || 'iPOS ZEN'}</h1>
                    <p className="text-[8pt] opacity-70">{profile?.address}</p>
                    <p className="text-[8pt] font-bold">Tél: {profile?.phone}</p>
                    <div className="grid grid-cols-2 gap-x-4 mt-2 text-[8pt] font-mono">
                        {profile?.rc_number && <span>RC: {profile.rc_number}</span>}
                        {profile?.nif && <span>NIF: {profile.nif}</span>}
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-sm font-bold border border-black px-4 py-1 inline-block mb-2">BON DE LIVRAISON</h2>
                    <p className="text-base font-bold font-mono">N° {sale.invoiceNumber}</p>
                    <p className="text-[8pt] text-gray-500 uppercase">Date: {date}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 border border-black rounded-md">
                    <p className="text-[8px] font-bold uppercase text-gray-400 mb-1">Destinataire</p>
                    <p className="text-sm font-bold uppercase">{customerName || 'Client de passage'}</p>
                </div>
                <div className="p-3 border border-dashed border-gray-300 rounded-md text-right flex flex-col justify-center">
                    <p className="text-[8px] font-bold uppercase text-gray-400 mb-0.5">Mode</p>
                    <p className="text-[9pt] font-bold uppercase">{sale.paymentStatus === 'paid' ? 'Au Comptant' : 'À Crédit'}</p>
                </div>
            </div>

            <table className="w-full border-collapse mb-6">
                <thead><tr className="bg-gray-50 border-y border-black"><th className="p-2 text-left font-bold uppercase w-[50%]">Désignation</th><th className="p-2 text-center font-bold w-16">Qté</th><th className="p-2 text-right font-bold w-24">P.U</th><th className="p-2 text-right font-bold w-32">Total</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                    {sale.items.map((item, idx) => (
                        <tr key={idx}><td className="p-2 uppercase text-[8.5pt]">{item.name}</td><td className="p-2 text-center font-bold">{item.quantity}</td><td className="p-2 text-right font-mono">{fmt(item.price)}</td><td className="p-2 text-right font-bold font-mono">{fmt(item.price * item.quantity)}</td></tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mb-6">
                <div className="w-64 space-y-1">
                    <div className="flex justify-between border-t border-black pt-2 font-bold text-[10pt]"><span>NET À PAYER:</span> <span>{fmt(sale.total)}</span></div>
                    <div className="flex justify-between text-[8.5pt] opacity-60"><span>Versé:</span> <span>-{fmt(safeNumber(sale.amountPaid))}</span></div>
                    <div className="flex justify-between font-bold border-t border-dashed pt-1"><span>SOLDE DÛ:</span> <span>{fmt(newBalance)}</span></div>
                </div>
            </div>

            <div className="p-3 bg-gray-50 border rounded-md mb-20">
                <p className="text-[8px] font-bold uppercase text-gray-400 mb-1">Somme arrêtée à :</p>
                <p className="text-[9pt] font-bold italic">{numberToFrenchWords(sale.total)}</p>
            </div>

            <div className="flex justify-between text-center px-10">
                <div className="w-32 pt-2 border-t border-dashed border-gray-300 text-[8pt] opacity-30">Cachet & Signature</div>
                <div className="w-32 pt-2 border-t border-dashed border-gray-300 text-[8pt] opacity-30">Bon pour accord</div>
            </div>

            <footer className="mt-20 pt-4 border-t border-gray-100 flex justify-between text-[7pt] text-gray-300 font-bold uppercase tracking-widest">
                <span>iPOS ZEN v2.9 — SOVEREIGN LEDGER</span>
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
