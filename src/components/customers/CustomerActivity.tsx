'use client';

import React from 'react';
import type { Sale, Payment, ProductReturn } from '@/lib/types';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from '@/components/ui/timeline';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HandCoins, ShoppingBag, Receipt, Undo2, History, Landmark } from 'lucide-react';

interface CustomerActivityProps {
  activity: any[];
  onSaleClick: (sale: Sale) => void;
  onReturnClick: (pr: ProductReturn) => void;
}

export function CustomerActivity({ activity, onSaleClick, onReturnClick }: CustomerActivityProps) {
  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center rounded-lg border-2 border-dashed">
        <Receipt className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Aucune activité</h3>
        <p className="text-muted-foreground">Ce client n'a pas encore d'historique de ventes ou de paiements.</p>
      </div>
    );
  }

  return (
    <Timeline>
      {activity.map((item, index) => {
        const isLast = index === activity.length - 1;
        const activityDate = safeToDate(item.date);
        const formattedDate = format(activityDate, 'd MMM yyyy, HH:mm', { locale: fr });
        
        if (item.type === 'sale') {
           const Icon = ShoppingBag;
           const sale = item as Sale;
           const title = `Vente #${sale.invoiceNumber}`;
          return (
            <TimelineItem key={`sale-${item.uuid || item.id}`}>
              {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <Icon className="h-5 w-5" />
                </TimelineIcon>
                <TimelineTitle>{title}</TimelineTitle>
                 <span className="text-sm text-muted-foreground ml-auto">{formattedDate}</span>
              </TimelineHeader>
              <TimelineBody>
                <div 
                  className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => onSaleClick(sale)}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-lg">{formatCurrency(sale.total)}</span>
                         <span className={cn('px-2 py-1 text-xs rounded-full font-semibold', {
                            'bg-chart-quaternary/10 text-chart-quaternary': sale.paymentStatus === 'paid',
                            'bg-chart-secondary/10 text-chart-secondary': sale.paymentStatus === 'partial',
                            'bg-destructive/10 text-destructive': sale.paymentStatus === 'unpaid',
                         })}>
                            {sale.paymentStatus === 'paid' ? 'Payé' : sale.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                        </span>
                    </div>
                     <p className="text-sm text-muted-foreground">
                        {(sale.items?.length || 0)} article(s). {sale.paymentStatus !== 'paid' && `Solde restant: ${formatCurrency(sale.remainingBalance)}`}
                    </p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else if (item.type === 'return') {
            const pr = item as ProductReturn;
           return (
             <TimelineItem key={`return-${item.uuid || item.id}`}>
               {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <Undo2 className="h-5 w-5 text-chart-secondary" />
                </TimelineIcon>
                <TimelineTitle>Retour sur facture #{pr.originalInvoiceNumber}</TimelineTitle>
                 <span className="text-sm text-muted-foreground ml-auto">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div 
                  className="p-4 bg-chart-secondary/10 rounded-lg hover:bg-chart-secondary/20 transition-colors cursor-pointer"
                  onClick={() => onReturnClick(pr)}
                >
                     <p className="font-semibold text-lg text-chart-secondary">- {formatCurrency(pr.totalReturnValue)}</p>
                     <p className="text-sm text-muted-foreground">Remboursé: {formatCurrency(pr.amountRefunded)} | {(pr.items?.length || 0)} article(s) retourné(s).</p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else if (item.type === 'payment') {
          const payment = item as Payment;
          return (
             <TimelineItem key={`payment-${item.uuid || item.id}`}>
               {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <HandCoins className="h-5 w-5 text-chart-quaternary" />
                </TimelineIcon>
                <TimelineTitle>Paiement reçu</TimelineTitle>
                 <span className="text-sm text-muted-foreground ml-auto">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div className="p-4 bg-chart-quaternary/10 rounded-lg">
                     <p className="font-semibold text-lg text-chart-quaternary">{formatCurrency(payment.amount)}</p>
                     <p className="text-sm text-muted-foreground">{payment.notes || 'Paiement enregistré.'}</p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else if (item.type === 'initial_balance') {
          return (
            <TimelineItem key={`init-${item.uuid}`}>
              {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <History className="h-5 w-5 text-primary" />
                </TimelineIcon>
                <TimelineTitle>Report de Solde Initial</TimelineTitle>
                <span className="text-sm text-muted-foreground ml-auto">Ouverture Dossier</span>
              </TimelineHeader>
              <TimelineBody>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-lg text-primary">{formatCurrency(item.amount)}</p>
                    <div className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                      Historique
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        }
        return null;
      })}
    </Timeline>
  );
}
