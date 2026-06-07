'use client';

import { useCallback } from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';

/**
 * useAutoPrint — hook React pour l'impression thermique 80mm.
 * Optimisé pour une mise en page "Elite" alignée sur les standards du secteur.
 */
export function useAutoPrint() {
    const isEnabled = useCallback((): boolean => {
        try {
            return (
                localStorage.getItem('ipos-autoprint-enabled') === 'true'
            );
        } catch {
            return false;
        }
    }, []);

    const printThermal = useCallback(
        (sale: Sale, profile: CompanyProfile | null) => {
            if (typeof window === 'undefined') return;

            const companyName = profile?.companyName || 'iPOS Zen Elite';
            const addr        = profile?.address     || '';
            const phone       = profile?.phone       || '';

            const rows = sale.items
                .map(i => {
                    const lineTotal = (
                        Number(i.price) * Number(i.quantity)
                    ).toLocaleString('fr-DZ', { minimumFractionDigits: 2 });
                    
                    return `<tr>
                    <td colspan="4" style="padding-top:5px; font-weight:bold; text-transform:uppercase; font-size:8.5pt;">${String(i.name)}</td>
                </tr>
                <tr>
                    <td style="width:15%"></td>
                    <td style="text-align:center; width:20%">${i.quantity}</td>
                    <td style="text-align:right; width:30%">${Number(i.price).toFixed(2)}</td>
                    <td style="text-align:right; width:35%">${lineTotal}</td>
                </tr>`;
                })
                .join('');

            const change    = Math.max(0, Number(sale.amountPaid) - Number(sale.total));
            const remaining = Math.max(0, Number(sale.remainingBalance));
            const formatNum = (v: number) => v.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @page { margin:0; size:80mm auto; }
  body {
    width:80mm; margin:0 auto;
    font-family:'Courier New', Courier, monospace;
    font-size:9pt; color:#000; background:#fff;
    padding:4mm 2mm;
    line-height: 1.3;
  }
  .c { text-align:center; }
  .r { text-align:right; }
  .b { font-weight:bold; }
  .lg { font-size:11pt; }
  .xs { font-size:7pt; }
  .sep { border-top:1px dashed #000; margin:2mm 0; }
  .sep2 { border-top:2px solid #000; margin:2mm 0; }
  table { width:100%; border-collapse:collapse; font-size:8.5pt; }
  th,td { padding:1px 0; }
  th { border-bottom:1px solid #000; font-size:7.5pt; }
</style>
</head>
<body>
  <div class="c b lg">${companyName.toUpperCase()}</div>
  ${addr  ? `<div class="c xs">${addr}</div>` : ''}
  ${phone ? `<div class="c xs">Tél: ${phone}</div>` : ''}
  
  <div class="sep2"></div>
  <div class="c b" style="text-decoration:underline; margin-bottom:2mm;">BON DE LIVRAISON</div>
  <div class="xs"><b>N° FACTURE:</b> ${sale.invoiceNumber}</div>
  <div class="xs"><b>DATE:</b> ${new Date(sale.createdAt!).toLocaleString('fr-DZ')}</div>
  
  <div class="sep"></div>
  
  <table>
    <thead>
      <tr>
        <th style="text-align:left; width:15%">#</th>
        <th style="text-align:center; width:20%">QTÉ</th>
        <th class="r" style="width:30%">P.U</th>
        <th class="r" style="width:35%">TOTAL</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  
  <div class="sep"></div>
  
  <div class="r b">TOTAL FACTURE: ${formatNum(sale.total)} DA</div>
  <div class="r b" style="color:#000; background:#eee; padding:1mm;">VERSEMENT (REÇU): -${formatNum(sale.amountPaid)} DA</div>
  
  ${remaining > 0.01 
      ? `<div class="r b lg" style="margin-top:1mm;">RESTE À PAYER: ${formatNum(remaining)} DA</div>` 
      : change > 0.01 
      ? `<div class="r b">MONNAIE RENDUE: ${formatNum(change)} DA</div>`
      : `<div class="r b" style="margin-top:1mm;">VENTE SOLDÉE</div>`
  }
  
  <div class="sep2"></div>
  <div class="c b" style="margin-top:3mm;">MERCI DE VOTRE VISITE !</div>
  <div class="c xs" style="margin-top:4mm; opacity:0.5;">iPOS Zen Elite System</div>
</body>
</html>`;

            const win = window.open('', '_blank', 'width=450,height=600,toolbar=no');
            if (!win) return;
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => {
                win.print();
                win.close();
            }, 500);
        },
        [],
    );

    return { printThermal, isEnabled };
}
