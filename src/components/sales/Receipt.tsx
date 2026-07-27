'use client';

import React, { useState, useEffect } from 'react';
import type { Sale, CompanyProfile, Customer } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, safeNumber, formatCurrency } from '@/lib/utils';
import { numberToFrenchWords } from '@/lib/numberToWords';
import { db } from '@/lib/db';

interface ReceiptProps {
    sale: Sale;
    profile: CompanyProfile | null;
    receiptType: 'a4' | 'thermal';
    customerName?: string;
    oldBalance?: number;
}

/**
 * Thermal Receipt (80mm)
 */
const ThermalReceipt = ({ sale, profile }: Omit<ReceiptProps, 'receiptType' | 'customerName' | 'oldBalance'>) => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    
    useEffect(() => {
        if (sale.customerUuid) {
            db.customers.where('uuid').equals(sale.customerUuid).first().then(c => setCustomer(c || null));
        }
    }, [sale.customerUuid]);

    const fmt = (v: number) => formatCurrency(v);
    const date = sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }) : format(new Date(), 'dd/MM/yyyy HH:mm');
    
    return (
        <div className="thermal-receipt bg-white text-black font-mono text-[9pt] leading-tight p-2">
            <div className="text-center mb-4">
                <p className="font-bold text-[12pt] uppercase tracking-tighter">{profile?.companyName || 'iPOS ZEN'}</p>
                <p className="text-[7pt] mt-1">{profile?.address}</p>
                <p className="text-[8pt] font-bold">Tél: {profile?.phone}</p>
            </div>

            <div className="border-y border-black border-dashed py-2 mb-4 text-center">
                <p className="font-bold text-[10pt]">BON DE LIVRAISON #{sale.invoiceNumber}</p>
            </div>

            <div className="text-[7.5pt] space-y-1 mb-4">
                <div className="flex justify-between"><span>DATE:</span> <span className="font-bold">{date}</span></div>
                <div className="flex justify-between">
                    <span>CLIENT:</span>
                    <span className="font-bold uppercase">{customer ? `${customer.firstName} ${customer.lastName}` : 'PASSAGE'}</span>
                </div>
            </div>

            <table className="w-full text-[8pt] mb-4 border-collapse">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left py-1">DES.</th>
                        <th className="text-center w-8">QTÉ</th>
                        <th className="text-right w-16">TOT</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100">
                            <td className="py-2 pr-1 font-bold uppercase truncate max-w-[35mm]">{item.name}</td>
                            <td className="text-center py-2">{item.quantity}</td>
                            <td className="text-right py-2 font-bold">{fmt(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t-2 border-black pt-2 space-y-1 text-[8.5pt]">
                <div className="flex justify-between"><span>TOTAL BRUT:</span> <span>{fmt(sale.subtotal)}</span></div>
                {sale.discountAmount > 0 && <div className="flex justify-between text-red-600 font-bold"><span>REMISE:</span> <span>-{fmt(sale.discountAmount)}</span></div>}
                
                <div className="flex justify-between font-black text-[12pt] border-t border-black mt-1 pt-1">
                    <span>NET À PAYER:</span>
                    <span>{fmt(sale.total)}</span>
                </div>
                
                <div className="flex justify-between text-[8.5pt] font-bold opacity-70 mt-2">
                    <span>VERSEMENT REÇU:</span>
                    <span>{fmt(safeNumber(sale.amountPaid))}</span>
                </div>
                
                {sale.remainingBalance > 0 && (
                    <div className="flex justify-between font-black border-t border-black pt-2 text-[10pt] bg-gray-50 px-1 mt-1">
                        <span>SOLDE DÛ:</span>
                        <span className="text-red-600">{fmt(sale.remainingBalance)}</span>
                    </div>
                )}
            </div>

            <p className="text-center mt-8 text-[7pt] uppercase tracking-widest opacity-40">Merci de votre confiance</p>
        </div>
    );
};

/**
 * A4 Invoice Layout
 */
const A4Receipt = ({ sale, profile }: Omit<ReceiptProps, 'receiptType' | 'customerName' | 'oldBalance'>) => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    
    useEffect(() => {
        if (sale.customerUuid) {
            db.customers.where('uuid').equals(sale.customerUuid).first().then(c => setCustomer(c || null));
        }
    }, [sale.customerUuid]);

    const fmt = (v: number) => formatCurrency(v);
    const date = sale.createdAt ? format(new Date(sale.createdAt), 'dd MMMM yyyy', { locale: fr }) : format(new Date(), 'dd/MM/yyyy');
    
    return (
        <div className="a4-receipt bg-white text-black font-sans text-[9pt] leading-normal">
          <div className="print-frame">
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                <div className="space-y-1 max-w-[65%]">
                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">{profile?.companyName || 'iPOS ZEN'}</h1>
                    <p className="text-[9.5pt] opacity-70 leading-relaxed">{profile?.address}</p>
                    <p className="text-[9.5pt] font-bold">Tél: {profile?.phone} | {profile?.email}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-black bg-black text-white px-5 py-2 inline-block mb-3">BON DE LIVRAISON</h2>
                    <p className="text-xl font-mono font-bold tracking-tighter">N° {sale.invoiceNumber}</p>
                    <p className="text-[9pt] text-gray-500 font-bold uppercase tracking-widest mt-1">Date: {date}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 mb-8">
                <div className="print-box border-l-[6px] border-l-black p-4 bg-gray-50/50">
                    <h3 className="text-[7.5pt] font-black uppercase text-gray-400 mb-2 tracking-widest">Client Destinataire</h3>
                    <p className="text-xl font-black uppercase">{customer ? `${customer.firstName} ${customer.lastName}` : 'CLIENT DE PASSAGE'}</p>
                    {customer?.address && <p className="text-[9pt] italic opacity-60 mt-1">{customer.address}</p>}
                    {customer?.phone && <p className="text-[9pt] font-bold mt-1">Tél: {customer.phone}</p>}
                </div>
            </div>

            <div className="flex-grow">
                <table className="print-table mb-8">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="text-left font-black uppercase text-[8pt] w-[50%]">Désignation des Articles</th>
                            <th className="text-center font-black uppercase text-[8pt] w-16">Qté</th>
                            <th className="text-right font-black uppercase text-[8pt] w-24">P.U (DA)</th>
                            <th className="text-right font-black uppercase text-[8pt] w-32">Montant Net</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sale.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="uppercase font-medium text-[8.5pt]">{item.name}</td>
                                <td className="text-center font-bold text-[8.5pt]">{item.quantity}</td>
                                <td className="text-right font-mono text-[8pt]">{fmt(item.price)}</td>
                                <td className="text-right font-bold font-mono text-[8.5pt]">{fmt(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end mb-8 no-break">
                <div className="w-96 print-box bg-gray-50/30 border-2">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="opacity-60 uppercase font-bold text-[7.5pt]">Total Marchandise:</span>
                            <span className="font-mono">{fmt(sale.subtotal)}</span>
                        </div>
                        {sale.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-red-600 font-bold">
                                <span className="uppercase text-[7.5pt]">Remise Accordée:</span>
                                <span className="font-mono">-{fmt(sale.discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-black pt-2 mb-2">
                            <span className="font-black uppercase text-[10pt]">Net à Payer (TTC):</span>
                            <span className="text-2xl font-black tracking-tighter font-mono">{fmt(sale.total)}</span>
                        </div>
                        <div className="flex justify-between text-[8.5pt] font-bold opacity-70">
                            <span>Versement reçu:</span>
                            <span className="font-mono">{fmt(safeNumber(sale.amountPaid))}</span>
                        </div>
                        {sale.remainingBalance > 0 && (
                            <div className="flex justify-between text-[11pt] font-black pt-2 bg-white px-2 py-1 rounded border border-gray-200 mt-1">
                                <span className="uppercase text-red-600">Reste à recouvrer:</span>
                                <span className="font-mono text-red-600">{fmt(sale.remainingBalance)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="print-box bg-gray-50 border-dashed mb-10 no-break">
                <p className="text-[7pt] font-black uppercase text-gray-400 mb-1 tracking-widest">Arrêtée la présente facture à la somme de :</p>
                <p className="text-[9.5pt] font-bold italic text-black">{numberToFrenchWords(sale.total)}</p>
            </div>

            <footer className="mt-auto pt-6 border-t border-gray-100 flex justify-between items-center text-[7.5pt] text-gray-400 font-black uppercase tracking-[0.2em]">
                <span>iPOS ZEN Sovereign Ledger Copy</span>
                <span>Généré le {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
            </footer>
          </div>
        </div>
    );
};

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
    ({ sale, profile, receiptType }, ref) => {
        return (
            <div ref={ref} className={cn("print-area-root", receiptType === 'thermal' ? 'thermal-receipt' : 'a4-receipt')}>
                {receiptType === 'thermal' ? <ThermalReceipt sale={sale} profile={profile} /> : <A4Receipt sale={sale} profile={profile} />}
            </div>
        );
    }
);

Receipt.displayName = 'Receipt';
