import React from 'react';
import { SaleInfoBarWrapper } from '@/components/layout/SaleInfoBarWrapper';

/**
 * Layout spécifique à la zone de vente.
 * Permet d'afficher la barre d'information (Totaux, Client) uniquement ici.
 */
export default function SellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SaleInfoBarWrapper />
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
