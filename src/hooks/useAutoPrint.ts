'use client';

import { useCallback } from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { numberToFrenchWords } from '@/lib/numberToWords';

/**
 * useAutoPrint — نظام الطباعة التلقائية السريعة iPOS Zen.
 * محاكي لتنسيق Receipt السيادي الموحد لضمان اتساق المخرجات وتوسيطها.
 */
export function useAutoPrint() {
    const isEnabled = useCallback((): boolean => {
        try {
            return localStorage.getItem('ipos-autoprint-enabled') === 'true';
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

            const formatNum = (v: number) => v.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            const rows = sale.items
                .map(i => {
                    const lineTotal = formatNum(Number(i.price) * Number(i.quantity));
                    return `
                    <tr style="border-bottom: 1px dotted #ccc">
                        <td colspan="3" style="padding: 6px 0; font-weight:bold; text-transform:uppercase; font-size:9pt;">${String(i.name)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee">
                        <td style="text-align:left; width:20%; font-size:10pt; font-weight:bold;">${i.quantity}</td>
                        <td style="text-align:right; width:40%; font-size:9pt;">${Number(i.price).toFixed(2)}</td>
                        <td style="text-align:right; width:40%; font-weight:bold; font-size:10pt;">${lineTotal}</td>
                    </tr>`;
                })
                .join('');

            const remaining = Math.max(0, Number(sale.remainingBalance));

            const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @page { margin:0; size:80mm auto; }
  body {
    width:72mm; margin:0 auto;
    font-family: 'Courier New', Courier, monospace;
    font-size:10pt; color:#000; background:#fff;
    padding:8mm 2mm;
    line-height: 1.2;
    text-align: center;
  }
  .c { text-align:center; }
  .r { text-align:right; }
  .l { text-align:left; }
  .b { font-weight:bold; }
  .lg { font-size:13pt; }
  .xs { font-size:8pt; }
  .sep { border-top:2px dashed #000; margin:4mm 0; }
  .sep2 { border-top:2px solid #000; margin:4mm 0; }
  table { width:100%; border-collapse:collapse; }
  td { vertical-align:top; }
  .total-box { background:#000; color:#fff; padding:2mm; font-size:11pt; font-weight:black; margin-top:2mm; text-align:left; }
</style>
</head>
<body>
  <div class="c b lg">${companyName.toUpperCase()}</div>
  <div class="c xs">${addr}</div>
  <div class="c b xs" style="margin-top:1mm">Tél: ${phone}</div>
  
  <div class="sep2"></div>
  <div class="c b" style="text-decoration:underline; font-size:11pt; margin-bottom:2mm;">BON DE LIVRAISON</div>
  <div class="l xs"><b>N° FACTURE:</b> #${sale.invoiceNumber}</div>
  <div class="l xs"><b>DATE:</b> ${new Date(sale.createdAt!).toLocaleString('fr-DZ')}</div>
  
  <div class="sep"></div>
  
  <table>
    <thead>
      <tr style="border-bottom:2px solid #000">
        <th style="text-align:left; font-size:9pt;">QTE</th>
        <th style="text-align:right; font-size:9pt;">P.U</th>
        <th style="text-align:right; font-size:9pt;">TOTAL</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  
  <div class="sep"></div>
  
  <div class="r">SOUS-TOTAL: <b>${formatNum(sale.subtotal)}</b></div>
  ${sale.discountAmount && sale.discountAmount > 0.01
      ? `<div class="r italic">REMISE: <b>-${formatNum(sale.discountAmount)}</b></div>`
      : ''}
  <div class="r b lg" style="margin-top:2mm; border-top:1px solid #000; padding-top:2mm">NET A PAYER: ${formatNum(sale.total)}</div>
  
  <div class="r b" style="margin-top:2mm; opacity:0.7">REÇU (VERS.): -${formatNum(sale.amountPaid)}</div>
  
  <div class="total-box">
    <div class="flex" style="display:flex; justify-content:space-between;">
        <span>SOLDE DÛ:</span>
        <span>${formatNum(remaining)} DA</span>
    </div>
  </div>
  
  <div class="sep2"></div>
  <div class="c b" style="margin-top:6mm; font-size:9pt; letter-spacing:1px;">MERCI DE VOTRE CONFIANCE</div>
  <div class="c xs" style="margin-top:4mm; opacity:0.3;">iPOS Zen Sovereign Ledger</div>
  <script>
    window.onload = function(){ 
      window.print(); 
      setTimeout(function(){ window.close(); }, 700);
    }
  </script>
</body>
</html>`;

            const win = window.open('', '_blank', 'width=450,height=800,toolbar=no');
            if (!win) return;
            win.document.write(html);
            win.document.close();
        },
        [],
    );

    return { printThermal, isEnabled };
}
