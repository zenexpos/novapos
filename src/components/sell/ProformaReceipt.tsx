'use client';

import React from 'react';
import type { ProformaInvoice, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { numberToFrenchWords } from '@/lib/numberToWords';

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
    const dateStr = format(new Date(proforma.createdAt), 'dd MMMM yyyy', { locale: fr });

    if (isThermal) {
      return (
        <div ref={ref} className="bg-white text-black font-mono text-[9pt] w-[80mm] p-4 thermal-receipt" style={{ lineHeight: '1.4' }}>
          <header className="text-center mb-6">
            <p className="font-black uppercase text-base tracking-tighter">{profile?.companyName || 'iPOS ZEN ELITE'}</p>
            <p className="text-[7pt] mt-1 opacity-70">{profile?.address}</p>
          </header>
          
          <div className="border-y-2 border-black py-2 mb-6 text-center">
            <p className="font-black text-[11pt] tracking-widest uppercase">FACTURE PROFORMA</p>
          </div>

          <div className="space-y-1 mb-6 text-[8pt]">
            <p><span className="opacity-40">RÉF :</span> <span className="font-bold">{proforma.proformaNumber}</span></p>
            <p><span className="opacity-40">DATE:</span> <span className="font-bold">{dateStr}</span></p>
            <p><span className="opacity-40">CLIENT:</span> <span className="font-bold">{customerName?.toUpperCase() || 'CLIENT DE PASSAGE'}</span></p>
          </div>

          <table className="w-full text-left text-[8pt] mb-6 border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-1">DESIGNATION</th>
                <th className="text-center py-1">QTE</th>
                <th className="text-right py-1">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {proforma.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 pr-2 leading-tight uppercase font-bold text-[7.5pt]">{item.name}</td>
                  <td className="text-center py-2 font-bold">{item.quantity}</td>
                  <td className="text-right py-2 font-bold">{formatNum(item.quantity * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between text-[11pt] font-black bg-gray-50 border-2 border-black px-2 py-3">
            <span>TOTAL DEVIS:</span>
            <span>{formatNum(proforma.total)} DA</span>
          </div>

          <footer className="text-center mt-10 pt-4 border-t-2 border-dashed border-gray-200">
            <p className="font-black text-[7.5pt] italic leading-tight">"DOCUMENT SANS VALEUR COMPTABLE – POUR INFORMATION UNIQUEMENT"</p>
            <p className="text-[6.5pt] opacity-30 mt-4 tracking-[0.2em]">iPOS ZEN SOVEREIGN</p>
          </footer>
        </div>
      );
    }

    return (
      <div ref={ref} className="bg-white text-[#111827] font-sans a4-receipt" style={{ minHeight: '297mm', padding: '15mm' }}>
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
            <span className="text-[120pt] font-black uppercase rotate-[-35deg]">PROFORMA</span>
        </div>

        <div className="relative z-10 flex justify-between items-start border-b-4 border-black pb-8 mb-10">
            <div className="max-w-[65%] space-y-1">
              <h1 className="text-3xl font-black uppercase text-[#111827] tracking-tighter">{profile?.companyName || 'iPOS ZEN'}</h1>
              <p className="text-[9pt] mt-2 opacity-60 leading-relaxed">{profile?.address}</p>
              <p className="text-[9pt] font-bold">Tél: {profile?.phone} | {profile?.email}</p>
              
              <div className="grid grid-cols-2 gap-x-6 mt-4 text-[7.5pt] font-mono opacity-50">
                {profile?.rcNumber && <p>RC: {profile.rcNumber}</p>}
                {profile?.nif && <p>NIF: {profile.nif}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black bg-gray-200 text-black px-6 py-2 inline-block mb-3 tracking-widest uppercase">Devis / Proforma</h2>
              <div className="mt-2">
                <p className="font-mono font-black text-xl">N° {proforma.proformaNumber}</p>
                <p className="text-[9pt] font-bold text-gray-500 uppercase tracking-widest mt-1">Date : {dateStr}</p>
              </div>
            </div>
        </div>

        <div className="relative z-10 mb-10 bg-gray-50 p-6 rounded-sm border-l-8 border-black">
            <h3 className="text-[8pt] font-black uppercase text-gray-400 mb-2 tracking-widest">Proposition Commerciale pour</h3>
            <p className="text-2xl font-black text-[#111827] uppercase">{customerName || 'Client de passage'}</p>
        </div>

        <table className="relative z-10 w-full border-collapse mb-12">
            <thead>
              <tr className="border-y-2 border-black bg-white text-black">
                <th className="text-left p-4 text-[8pt] font-black uppercase border-r border-gray-100">Désignation des Articles</th>
                <th className="text-center p-4 text-[8pt] font-black uppercase border-r border-gray-100 w-20">Qté</th>
                <th className="text-right p-4 text-[8pt] font-black uppercase border-r border-gray-100 w-32">P.U (DA)</th>
                <th className="text-right p-4 text-[8pt] font-black uppercase w-40">Montant Total</th>
              </tr>
            </thead>
            <tbody>
              {proforma.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-bold text-[9pt] uppercase">{item.name}</td>
                  <td className="p-4 text-center font-black text-[9pt]">{item.quantity}</td>
                  <td className="p-4 text-right font-mono text-[9pt]">{formatNum(item.price)}</td>
                  <td className="p-4 text-right font-black text-[10pt] tracking-tighter">{formatNum(item.quantity * item.price)}</td>
                </tr>
              ))}
            </tbody>
        </table>

        <div className="relative z-10 flex justify-end mb-16">
            <div className="w-96 bg-white text-black border-4 border-black p-6 flex justify-between items-center shadow-lg">
                <span className="text-[9pt] font-black uppercase tracking-widest opacity-60">TOTAL DEVIS HT</span>
                <span className="text-3xl font-black tracking-tighter tabular-nums">{formatNum(proforma.total)} DA</span>
            </div>
        </div>

        <div className="relative z-10 p-6 border-2 border-dashed border-gray-200 text-center mb-16">
            <p className="text-[9pt] font-black text-gray-400 italic">"Cette facture proforma n'est pas un document de vente définitif. Elle est fournie à titre indicatif pour vos besoins administratifs."</p>
            <p className="text-[8pt] font-bold mt-2">Validité de l'offre : 15 jours à compter de la date d'émission.</p>
        </div>

        <div className="relative z-10 flex justify-between text-center px-12 mt-20">
            <div className="w-48 pt-2 border-t-2 border-dashed border-gray-200 text-[8pt] font-black uppercase opacity-20">Visa Direction</div>
            <div className="w-48 pt-2 border-t-2 border-dashed border-gray-200 text-[8pt] font-black uppercase opacity-20">Signature Client</div>
        </div>

        <footer className="mt-auto pt-10 text-center text-[7pt] font-black text-gray-300 uppercase tracking-[0.4em]">
            Document généré par iPOS ZEN ELITE SYSTEM - {new Date().toLocaleDateString()}
        </footer>
      </div>
    );
  }
);

ProformaReceipt.displayName = 'ProformaReceipt';
