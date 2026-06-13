'use client';

import React from 'react';
import type { Customer, Sale, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, safeToDate } from '@/lib/utils';

interface CustomerStatementProps {
  customer: Customer;
  unpaidSales: Sale[];
  profile: CompanyProfile | null;
}

export const CustomerStatement = React.forwardRef<HTMLDivElement, CustomerStatementProps>(({ customer, unpaidSales, profile }, ref) => {
    const totalRemaining = unpaidSales.reduce((sum, s) => sum + s.remainingBalance, 0);

    return (
        <div ref={ref} className="a4-receipt bg-white text-black font-sans leading-normal" style={{ width: '210mm' }}>
          <div className="print-frame">
            {/* Header */}
            <header className="flex justify-between items-start pb-6 border-b-2 border-black mb-8">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black uppercase tracking-tighter">{profile?.companyName || 'iPOS ZEN'}</h1>
                    <p className="text-[9pt] font-medium opacity-70">{profile?.address}</p>
                    <p className="text-[9pt] font-medium opacity-70">{profile?.city}, {profile?.country}</p>
                    <p className="text-[9pt] font-bold mt-2">Tél: {profile?.phone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-black bg-black text-white px-6 py-2 inline-block mb-2">RELEVÉ DE COMPTE</h2>
                    <p className="text-[9pt] font-bold uppercase tracking-widest text-gray-500">Date : {format(new Date(), 'd MMMM yyyy', { locale: fr })}</p>
                </div>
            </header>

            {/* Customer & Summary Frame */}
            <div className="grid grid-cols-2 gap-8 mb-10">
                <section className="print-box space-y-4">
                    <h3 className="text-[7.5pt] font-black uppercase text-gray-400 tracking-widest">Destinataire / Client</h3>
                    <div className="space-y-1">
                        <p className="text-xl font-black uppercase">{customer.firstName} {customer.lastName}</p>
                        <p className="text-[9pt] font-medium opacity-60 italic">{customer.address || '—'}</p>
                        <p className="text-[9pt] font-bold">Tel: {customer.phone || '—'}</p>
                    </div>
                </section>

                <section className="print-box bg-gray-50/50 flex flex-col justify-center text-center space-y-4 border-2">
                    <div>
                        <p className="text-[7.5pt] font-black uppercase text-gray-400 tracking-widest mb-1">Solde Débiteur Actuel</p>
                        <p className="text-3xl font-black text-red-600 tracking-tighter">{formatCurrency(customer.outstandingBalance)}</p>
                    </div>
                    <div className="h-px bg-gray-200 w-1/2 mx-auto" />
                    <div className="flex justify-around text-[9px] font-black uppercase opacity-50">
                        <span>Plafond: {formatCurrency(customer.creditLimit || 0)}</span>
                        <span>Flux: {unpaidSales.length} Factures</span>
                    </div>
                </section>
            </div>

            {/* Table with borders */}
            <section className="mb-10">
                <h3 className="text-[8pt] font-black uppercase mb-4 flex items-center gap-3">
                    <div className="h-2 w-2 bg-black rounded-full" />
                    Détail des Factures en Souffrance
                </h3>
                <table className="print-table">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="text-left p-3 text-[8pt] font-black uppercase">Date</th>
                            <th className="text-left p-3 text-[8pt] font-black uppercase">N° Facture</th>
                            <th className="text-right p-3 text-[8pt] font-black uppercase">Total</th>
                            <th className="text-right p-3 text-[8pt] font-black uppercase">Payé</th>
                            <th className="text-right p-3 text-[8pt] font-black uppercase">Solde Dû</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {unpaidSales.map(sale => (
                            <tr key={sale.uuid}>
                                <td className="p-3 text-[9pt] font-bold">{format(safeToDate(sale.createdAt!), 'dd/MM/yyyy')}</td>
                                <td className="p-3 text-[9pt] font-mono font-bold">#{sale.invoiceNumber}</td>
                                <td className="p-3 text-right text-[9pt] font-medium">{formatCurrency(sale.total)}</td>
                                <td className="p-3 text-right text-[9pt] font-medium text-emerald-600">{formatCurrency(sale.amountPaid)}</td>
                                <td className="p-3 text-right text-[9.5pt] font-black tracking-tighter">{formatCurrency(sale.remainingBalance)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-50 font-black border-t-2 border-black">
                            <td colSpan={4} className="p-4 text-right text-[10pt] uppercase">Total Cumulé des Créances</td>
                            <td className="p-4 text-right text-xl text-red-600 tracking-tighter">{formatCurrency(totalRemaining)}</td>
                        </tr>
                    </tfoot>
                </table>
            </section>

            {/* Verification Footer */}
            <footer className="mt-20 pt-8 border-t border-dashed border-gray-300 grid grid-cols-2 text-center">
                <div className="space-y-16">
                    <p className="text-[8pt] font-black uppercase tracking-widest opacity-40">Visa & Cachet Établissement</p>
                    <div className="h-24 w-24 mx-auto border-4 border-gray-100 rounded-full flex items-center justify-center opacity-10">
                        <span className="text-[8px]">STAMP</span>
                    </div>
                </div>
                <div className="space-y-16 border-l border-gray-100">
                    <p className="text-[8pt] font-black uppercase tracking-widest opacity-40">Signature du Client</p>
                    <p className="text-[9pt] italic text-gray-300">"Bon pour accord du solde cité ci-dessus"</p>
                </div>
            </footer>

            <p className="text-center mt-20 text-[7pt] font-black uppercase tracking-[0.4em] text-gray-200">
                Document généré informatiquement par iPOS ZEN SYSTEM — SOUVERAINETÉ TOTALE
            </p>
          </div>
        </div>
    );
});
CustomerStatement.displayName = 'CustomerStatement';