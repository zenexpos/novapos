'use client';
/**
 * @fileOverview Service de gestion des ventes Maître.
 * Audit Zero Defect : Centralisation des transactions atomiques et hardening financier.
 * Scope transactionnel étendu pour garantir l'intégrité du stock et des dettes clients.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Sale, CartItem, SaleItem } from '@/lib/types';
import { db } from '@/lib/db';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { safeNumber, preciseMultiply, roundFinancial, safeToDate } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

class SalesService {
  private triggerSync() {
    if (typeof window !== 'undefined') {
      const state = useAppStore.getState();
      if (state?.actions?.triggerSmartSync) {
        state.actions.triggerSmartSync();
      }
    }
  }

  async getSaleByUuid(uuid: string): Promise<Sale | undefined> {
    return db.sales.where('uuid').equals(uuid).first();
  }

  async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
    return db.sales.where('invoiceNumber').equals(invoiceNumber).first();
  }

  /**
   * Crée une vente atomique.
   * Met à jour le stock, le solde client et les logs d'inventaire en un seul commit.
   */
  async createSale(saleData: {
    items: CartItem[];
    discountType: 'fixed' | 'percentage';
    discountValue: number;
    amountPaid: number;
    customerUuid?: string | null;
    dueDate?: Date;
  }): Promise<Sale> {
    if (!saleData.items || saleData.items.length === 0) {
      throw new Error("Impossible de valider un panier vide.");
    }

    const now = new Date();
    
    const subtotalCents = saleData.items.reduce((acc, item) => {
        const itemTotal = preciseMultiply(item.price, item.cartQuantity);
        return acc + Math.round(itemTotal * 100);
    }, 0);

    const subtotal = subtotalCents / 100;

    let discountAmount = 0;
    if (saleData.discountType === 'percentage') {
        discountAmount = roundFinancial((subtotal * safeNumber(saleData.discountValue)) / 100);
    } else {
        discountAmount = roundFinancial(safeNumber(saleData.discountValue));
    }

    const total = roundFinancial(Math.max(0, subtotal - discountAmount));
    const amountPaid = roundFinancial(safeNumber(saleData.amountPaid));
    const remainingBalance = roundFinancial(Math.max(0, total - amountPaid));

    const paymentStatus: Sale['paymentStatus'] =
      Math.abs(remainingBalance) < 0.009 ? 'paid' :
      amountPaid > 0.009 ? 'partial' : 'unpaid';

    const saleItems: SaleItem[] = saleData.items.map(item => ({
      productUuid: (item.uuid && !item.uuid.startsWith('custom-')) ? item.uuid : null,
      name: item.name,
      price: safeNumber(item.price),
      purchasePrice: safeNumber(item.purchasePrice),
      quantity: safeNumber(item.cartQuantity),
    }));

    const newSale: Sale = {
      uuid: uuidv4(),
      invoiceNumber: await this.generateInvoiceNumber(),
      items: saleItems,
      subtotal,
      discountAmount,
      total,
      amountPaid,
      remainingBalance,
      paymentStatus,
      customerUuid: saleData.customerUuid || undefined,
      createdAt: now,
      updatedAt: now,
      dueDate: saleData.dueDate,
      syncStatus: 'pending',
      version: 1,
      isCancelled: false
    };

    // ATOMIC TRANSACTION : Hardening Zero Defect
    // On verrouille toutes les tables impactées par une vente
    await db.transaction('rw', [
      db.sales, db.products, db.inventory_logs, db.customers, 
      db.company_profile, db.sync_queue, db.payments,
      db.product_returns, db.bread_orders, db.suppliers,
      db.supplier_payments, db.stock_intakes
    ], async () => {
      await db.sales.add(newSale);
      
      for (const item of saleData.items) {
        if (item.uuid && !item.uuid.startsWith('custom-') && item.uuid !== 'BREAD_VIRTUAL_PROD') {
          await inventoryService.adjustStock(
            item.uuid, 
            -item.cartQuantity, 
            'sale', 
            newSale.uuid,
            `Vente #${newSale.invoiceNumber}`
          );
        }
      }
      
      if (newSale.customerUuid) {
        await customerService.recalculateCustomerStatus(newSale.customerUuid);
      }

      await db.sync_queue.add({
        table: 'sales',
        operation: 'CREATE',
        payload: newSale,
        timestamp: Date.now()
      });
    });

    this.triggerSync();
    return newSale;
  }

  async processSaleCancellation(uuid: string): Promise<void> {
    const sale = await this.getSaleByUuid(uuid);
    if (!sale || sale.isCancelled) return;

    await db.transaction('rw', [
      db.sales, db.products, db.inventory_logs, db.customers, 
      db.sync_queue, db.payments, db.product_returns, 
      db.bread_orders, db.company_profile, db.suppliers,
      db.supplier_payments, db.stock_intakes
    ], async () => {
      await db.sales.update(sale.id!, { 
        isCancelled: true, 
        updatedAt: new Date(),
        syncStatus: 'pending' 
      });

      for (const item of sale.items) {
        if (item.productUuid) {
          await inventoryService.adjustStock(
            item.productUuid, 
            item.quantity, 
            'cancellation', 
            sale.uuid,
            `Annulation #${sale.invoiceNumber}`
          );
        }
      }

      if (sale.customerUuid) {
        await customerService.recalculateCustomerStatus(sale.customerUuid);
      }

      await db.sync_queue.add({
        table: 'sales',
        operation: 'UPDATE',
        payload: { ...sale, isCancelled: true },
        timestamp: Date.now()
      });
    });

    this.triggerSync();
  }

  private async generateInvoiceNumber(): Promise<string> {
    const profile = await db.company_profile.toCollection().first();
    const currentCounter = profile?.invoiceCounter ?? 1;
    const prefix = profile?.invoicePrefix || String(new Date().getFullYear());
    const invoiceNumber = `${prefix}-${String(currentCounter).padStart(6, '0')}`;

    if (profile?.id) {
      await db.company_profile.update(profile.id, {
        invoiceCounter: currentCounter + 1,
        updatedAt: new Date()
      });
    }
    return invoiceNumber;
  }

  async filterSales(filters: {
    query?: string;
    status?: string;
    from?: Date;
    to?: Date;
  }): Promise<Sale[]> {
    const { startOfDay, endOfDay } = await import('date-fns');
    let collection = db.sales.toCollection();

    if (filters.from) {
      const start = startOfDay(filters.from);
      const end = endOfDay(filters.to || new Date());
      collection = db.sales.where('createdAt').between(start, end, true, true);
    }

    let results = await collection.toArray();

    if (filters.status && filters.status !== 'all') {
      results = results.filter(s => s.paymentStatus === filters.status);
    }

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      results = results.filter(s => s.invoiceNumber.toLowerCase().includes(q));
    }

    return results.sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime());
  }
}

export const salesService = new SalesService();
