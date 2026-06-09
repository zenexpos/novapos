'use client';

import { useCallback } from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';

/**
 * useAutoPrint — هوك الطباعة التلقائية السريعة للطابعات الحرارية.
 * يستخدم نافذة منبثقة مخفية لضمان عدم تعطل واجهة البيع.
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

            const rows = sale.items
                .map(i => {
                    const lineTotal = (Number(i.price) * Number(i.quantity)).toLocaleString('fr-DZ', { minimumFractionDigits: 2 });
                    return `<tr>
                        <td colspan="3" style="padding-top:5px; font-weight:bold; text-transform:uppercase; font-size:8.5pt;">${String(i.name)}</td>
                    </tr>
                    <tr style="border-bottom: 1px dotted #ccc">
                        <td style="text-align:left; width:20%">${i.quantity}</td>
                        <td style="text-align:right; width:40%">${Number(i.price).toFixed(2)}</td>
                        <td style="text-align:right; width:40%">${lineTotal}</td>
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
    width:76mm; margin:0 auto;
    font-family:'Courier New', Courier, monospace;
    font-size:9pt; color:#000; background:#fff;
    padding:5mm 2mm;
    line-height: 1.4;
  }
  .c { text-align:center; }
  .r { text-align:right; }
  .b { font-weight:bold; }
  .lg { font-size:12pt; }
  .xs { font-size:7.5pt; }
  .sep { border-top:1px dashed #000; margin:3mm 0; }
  .sep2 { border-top:2px solid #000; margin:3mm 0; }
  table { width:100%; border-collapse:collapse; }
  td { padding:1px 0; vertical-align:top; }
</style>
</head>
<body>
  <div class="c b lg">${companyName.toUpperCase()}</div>
  <div class="c xs">${addr}</div>
  <div class="c b xs">Tél: ${phone}</div>
  
  <div class="sep2"></div>
  <div class="c b" style="text-decoration:underline; margin-bottom:1mm;">BON DE LIVRAISON</div>
  <div class="xs"><b>N° FACTURE:</b> ${sale.invoiceNumber}</div>
  <div class="xs"><b>DATE:</b> ${new Date(sale.createdAt!).toLocaleString('fr-DZ')}</div>
  
  <div class="sep"></div>
  
  <table style="font-size:8.5pt">
    <thead>
      <tr style="border-bottom:1px solid #000">
        <th style="text-align:left">QTÉ</th>
        <th style="text-align:right">P.U</th>
        <th style="text-align:right">TOTAL</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  
  <div class="sep"></div>
  
  <div class="r b">TOTAL NET: ${formatNum(sale.total)} DA</div>
  <div class="r b" style="margin-top:1mm; padding:1mm; background:#eee">REÇU : ${formatNum(sale.amountPaid)} DA</div>
  
  ${remaining > 0.01 
      ? `<div class="r b lg" style="margin-top:2mm; border:1px solid #000; padding:1mm">SOLDE DU: ${formatNum(remaining)} DA</div>` 
      : `<div class="r b lg" style="margin-top:2mm; text-align:center">*** VENTE SOLDÉE ***</div>`
  }
  
  <div class="sep2"></div>
  <div class="c b" style="margin-top:4mm;">MERCI DE VOTRE VISITE !</div>
  <div class="c xs" style="margin-top:4mm; opacity:0.3;">iPOS Zen Sovereign System</div>
  <script>window.onload = function(){ window.print(); window.close(); }</script>
</body>
</html>`;

            const win = window.open('', '_blank', 'width=450,height=600,toolbar=no');
            if (!win) return;
            win.document.write(html);
            win.document.close();
        },
        [],
    );

    return { printThermal, isEnabled };
}
