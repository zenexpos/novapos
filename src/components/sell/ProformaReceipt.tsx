'use client';

import React from 'react';
import type { ProformaInvoice, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProformaReceiptProps {
  proforma: ProformaInvoice;
  profile: CompanyProfile | null;
  receiptType: 'a4' | 'thermal';
  customerName?: string;
}

export const ProformaReceipt = React.forwardRef<HTMLDivElement, ProformaReceiptProps>(
  ({ proforma, profile, receiptType, customerName }, ref) => {
    const isThermal = receiptType === 'thermal';
    const formatNum = (val: number) => val.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dateStr = format(new Date(proforma.createdAt), 'dd/MM/yyyy HH:mm');

    if (isThermal) {
      return (
        <div ref={ref} className="bg-white text-black font-mono text-[9pt] w-[80mm] p-4 thermal-receipt" style={{ lineHeight: '1.4', letterSpacing: '-0.2px' }}>
          <header className="text-center mb-4">
            <p className="font-bold uppercase text-base">{profile?.companyName || 'iPOS ZEN ELITE'}</p>
            <p className="text-[7pt] mt-1">{profile?.address}</p>
          </header>
          <div className="border-b border-black border-dashed my-2" />
          <div className="space-y-0.5 mb-4 text-[8pt]">
            <p className="font-bold text-center underline mb-2 text-[9pt]">FACTURE PROFORMA</p>
            <p><span className="font-bold">N°:</span> {proforma.proformaNumber}</p>
            <p><span className="font-bold">DATE:</span> {dateStr}</p>
            <p><span className="font-bold">CLIENT:</span> {customerName || 'Client de passage'}</p>
          </div>
          <table className="w-full text-left text-[8pt] mb-4 border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1">DESIGNATION</th>
                <th className="text-center py-1">QTE</th>
                <th className="text-right py-1">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {proforma.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 pr-2 leading-tight uppercase font-bold text-[7.5pt]">{item.name}</td>
                  <td className="text-center py-1 font-bold">{item.quantity}</td>
                  <td className="text-right py-1 font-bold">{formatNum(item.quantity * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-black border-dashed my-2" />
          <div className="flex justify-between text-[10pt] font-black bg-white border border-black px-1 py-2">
            <span>TOTAL PROFORMA:</span>
            <span>{formatNum(proforma.total)} DA</span>
          </div>
          <footer className="text-center mt-6 pt-2 border-t border-dashed border-gray-400">
            <p className="font-bold text-[7pt] italic">Cette facture est une facture proforma sans valeur comptable.</p>
            <p className="text-[6.5pt] opacity-40 mt-2">SYSTEME iPOS ZEN</p>
          </footer>
        </div>
      );
    }

    return (
      <div ref={ref} className="bg-white text-[#111827] font-sans a4-receipt-wrapper" style={{ minHeight: '297mm', padding: '15mm' }}>
        <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
            <div className="max-w-[60%]">
              <h1 className="text-3xl font-black uppercase text-[#111827]">{profile?.companyName || 'iPOS ZEN'}</h1>
              <p className="text-sm mt-2 opacity-70">{profile?.address}</p>
              <p className="text-sm font-bold">{profile?.phone}</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-black text-gray-400 uppercase tracking-tighter">Facture Proforma</h2>
              <div className="mt-4">
                <p className="font-mono font-bold text-lg">N° : {proforma.proformaNumber}</p>
                <p className="text-sm font-bold text-gray-500 uppercase">Date : {dateStr.split(' ')[0]}</p>
              </div>
            </div>
        </div>
        <div className="mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Client</h3>
            <p className="text-2xl font-black text-[#111827]">{customerName || 'Client de passage'}</p>
        </div>
        <table className="w-full border-collapse mb-10">
            <thead>
              <tr className="border-y-2 border-black bg-white text-black">
                <th className="text-left p-4 text-xs font-black uppercase border-r border-black/10">Désignation</th>
                <th className="text-center p-4 text-xs font-black uppercase border-r border-black/10">Qté</th>
                <th className="text-right p-4 text-xs font-black uppercase border-r border-black/10">Prix Unitaire</th>
                <th className="text-right p-4 text-xs font-black uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {proforma.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="p-4 font-bold text-sm uppercase">{item.name}</td>
                  <td className="p-4 text-center font-bold">{item.quantity}</td>
                  <td className="p-4 text-right font-mono">{formatNum(item.price)}</td>
                  <td className="p-4 text-right font-black">{formatNum(item.quantity * item.price)}</td>
                </tr>
              ))}
            </tbody>
        </table>
        <div className="flex justify-end">
            <div className="w-80 bg-white text-black border-2 border-black p-6 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest opacity-60">TOTAL HT (DA)</span>
                <span className="text-3xl font-black tracking-tighter">{formatNum(proforma.total)}</span>
            </div>
        </div>
        <div className="mt-20 p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center">
            <p className="text-sm font-bold text-gray-400 italic">"Cette facture est une facture proforma sans valeur comptable."</p>
        </div>
        <footer className="mt-auto pt-10 text-center text-[8px] font-bold text-gray-300 uppercase tracking-widest">
            Document généré par iPOS ZEN ELITE - {new Date().toLocaleDateString()}
        </footer>
      </div>
    );
  }
);

ProformaReceipt.displayName = 'ProformaReceipt';
