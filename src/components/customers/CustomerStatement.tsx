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
        <div ref={ref} className="p-12 bg-white text-black font-sans leading-normal">
            {/* Header */}
            <header className="flex justify-between items-start pb-8 border-b-2 border-black mb-10">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black uppercase tracking-tighter">{profile?.companyName || 'SMART IPOS'}</h1>
                    <p className="text-sm font-medium opacity-70">{profile?.address}</p>
                    <p className="text-sm font-medium opacity-70">{profile?.city}, {profile?.country}</p>
                    <p className="text-sm font-bold mt-2">Tél: {profile?.phone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-black bg-black text-white px-6 py-2 inline-block mb-2">RELEVÉ DE COMPTE</h2>
                    <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Date d'émission: {format(new Date(), 'd MMMM yyyy', { locale: fr })}</p>
                </div>
            </header>

            {/* Customer & Summary */}
            <div className="grid grid-cols-2 gap-10 mb-12">
                <section className="p-6 border-2 border-black rounded-2xl space-y-4">
                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Destinataire / Client</h3>
                    <div className="space-y-1">
                        <p className="text-xl font-bold">{customer.firstName} {customer.lastName}</p>
                        <p className="text-sm font-medium opacity-60 italic">{customer.address || '—'}</p>
                        <p className="text-sm font-bold">Tel: {customer.phone || '—'}</p>
                    </div>
                </section>

                <section className="bg-gray-50 p-6 rounded-2xl border-2 border-black flex flex-col justify-center text-center space-y-4">
                    <div>
                        <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Solde Débiteur Actuel</p>
                        <p className="text-3xl font-black text-red-600 tracking-tighter">{formatCurrency(customer.outstandingBalance)}</p>
                    </div>
                    <div className="h-px bg-gray-200 w-1/2 mx-auto" />
                    <div className="flex justify-around text-[10px] font-black uppercase opacity-40">
                        <span>Limite: {formatCurrency(customer.creditLimit || 0)}</span>
                        <span>Flux: {unpaidSales.length} Factures</span>
                    </div>
                </section>
            </div>

            {/* Table */}
            <section className="mb-12">
                <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-3">
                    <div className="h-2 w-2 bg-black rounded-full" />
                    Détail des Factures en Souffrance
                </h3>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-black text-white">
                            <th className="text-left p-4 text-xs font-black uppercase">Date</th>
                            <th className="text-left p-4 text-xs font-black uppercase">N° Facture</th>
                            <th className="text-right p-4 text-xs font-black uppercase">Total</th>
                            <th className="text-right p-4 text-xs font-black uppercase">Payé</th>
                            <th className="text-right p-4 text-xs font-black uppercase">Solde Dû</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black/5">
                        {unpaidSales.map(sale => (
                            <tr key={sale.uuid} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-sm font-bold">{format(safeToDate(sale.createdAt!), 'dd/MM/yyyy')}</td>
                                <td className="p-4 text-sm font-mono font-bold">#{sale.invoiceNumber}</td>
                                <td className="p-4 text-right text-sm font-medium">{formatCurrency(sale.total)}</td>
                                <td className="p-4 text-right text-sm font-medium text-emerald-600">{formatCurrency(sale.amountPaid)}</td>
                                <td className="p-4 text-right text-sm font-black tracking-tighter">{formatCurrency(sale.remainingBalance)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-4 border-black bg-gray-50">
                            <td colSpan={4} className="p-4 text-right text-sm font-black uppercase">Total Cumulé des Créances</td>
                            <td className="p-4 text-right text-xl font-black text-red-600 tracking-tighter">{formatCurrency(totalRemaining)}</td>
                        </tr>
                    </tfoot>
                </table>
            </section>

            {/* Verification Footer */}
            <footer className="mt-20 pt-10 border-t border-dashed border-gray-300 grid grid-cols-2 text-center">
                <div className="space-y-16">
                    <p className="text-[10px] font-black uppercase tracking-widest">Visa & Cachet Établissement</p>
                    <div className="h-24 w-24 mx-auto border-4 border-gray-100 rounded-full flex items-center justify-center opacity-10">
                        <span className="text-[8px]">STAMP</span>
                    </div>
                </div>
                <div className="space-y-16 border-l border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest">Signature du Client</p>
                    <p className="text-xs italic text-gray-300">"Bon pour accord du solde cité ci-dessus"</p>
                </div>
            </footer>

            <p className="text-center mt-20 text-[8px] font-bold uppercase tracking-[0.3em] text-gray-300">
                Ce document est généré informatiquement par iPOS ZEN SYSTEM
            </p>
        </div>
    );
});
CustomerStatement.displayName = 'CustomerStatement';
