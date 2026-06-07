'use client';

import React from 'react';
import type { StockIntake, SupplierPayment } from '@/lib/types';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from '@/components/ui/timeline';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HandCoins, Archive, Receipt, Hash } from 'lucide-react';

interface SupplierActivityProps {
  activity: Record<string, unknown>[];
  onIntakeClick: (intake: StockIntake) => void;
}

export function SupplierActivity({ activity, onIntakeClick }: SupplierActivityProps) {
  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/10">
        <Receipt className="h-12 w-12 text-muted-foreground/30" />
        <h3 className="mt-4 text-lg font-bold tracking-tight">Aucune activité</h3>
        <p className="text-muted-foreground text-sm">Ce fournisseur n'a pas encore d'historique de réceptions ou de paiements.</p>
      </div>
    );
  }

  return (
    <Timeline>
      {activity.map((item, index) => {
        const isLast = index === activity.length - 1;
        const activityDate = safeToDate(item.date as string | Date);
        const formattedDate = format(activityDate, 'dd MMM yyyy, HH:mm', { locale: fr });
        
        if (item.type === 'intake') {
           const intake = item as unknown as StockIntake;
          return (
            <TimelineItem key={`intake-${item.uuid}`}>
              {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <Archive className="h-5 w-5 text-primary" />
                </TimelineIcon>
                <TimelineTitle className="flex items-center gap-2">
                    Réception de Stock
                    <span className="px-2 py-0.5 bg-muted rounded-md font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                        <Hash className="h-2.5 w-2.5" /> {intake.invoiceNumber || intake.uuid.substring(0,8)}
                    </span>
                </TimelineTitle>
                 <span className="text-[10px] font-semibold uppercase tracking-tighter text-muted-foreground/50 ml-auto">{formattedDate}</span>
              </TimelineHeader>
              <TimelineBody>
                <div 
                  className="p-4 bg-muted/30 rounded-2xl border border-border/50 hover:bg-muted/50 transition-all cursor-pointer group"
                  onClick={() => onIntakeClick(intake)}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-lg group-hover:text-primary transition-colors">{formatCurrency(intake.totalValue)}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {intake.items.length} Article(s)
                        </span>
                    </div>
                     <p className="text-xs text-muted-foreground font-medium">
                        Inclut {formatCurrency(intake.shippingCost || 0)} de frais de transport répartis.
                    </p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else if (item.type === 'payment') {
          const payment = item as unknown as SupplierPayment;
          return (
             <TimelineItem key={`payment-${item.uuid}`}>
               {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <HandCoins className="h-5 w-5 text-emerald-500" />
                </TimelineIcon>
                <TimelineTitle>Versement effectué</TimelineTitle>
                 <span className="text-[10px] font-semibold uppercase tracking-tighter text-muted-foreground/50 ml-auto">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                     <p className="font-semibold text-lg text-emerald-500">{formatCurrency(payment.amount)}</p>
                     <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">
                            {payment.method === 'cash' ? 'Espèces' : payment.method === 'check' ? 'Chèque' : 'Virement'}
                        </span>
                        <p className="text-xs text-muted-foreground font-medium">{payment.notes || 'Aucune note.'}</p>
                     </div>
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
