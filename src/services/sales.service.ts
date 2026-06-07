'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Sale, CartItem, SaleItem } from '@/lib/types';
import { db } from '@/lib/db';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { safeToDate, safeNumber, roundFinancial, preciseMultiply } from '@/lib/utils';
import { startOfDay, endOfDay } from 'date-fns';
import { useAppStore } from '@/stores/appStore';

const triggerSync = () => {
    if (typeof window !== 'undefined') {
        const state = useAppStore.getState();
        if (state && state.actions) {
            state.actions.triggerSmartSync();
        }
    }
};

/**
 * Service de gestion des ventes Elite.
 */
class SalesService {

    async getSaleByUuid(uuid: string): Promise<Sale | undefined> {
        return db.sales.where('uuid').equals(uuid).first();
    }

    async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        return db.sales.where('invoiceNumber').equals(invoiceNumber).first();
    }

    async filterSales(filters: {
        query?: string;
        status?: 'all' | 'paid' | 'partial' | 'unpaid';
        from?: Date;
        to?: Date;
    }): Promise<Sale[]> {
        let collection = db.sales.toCollection();
        const endDate = filters.to ? endOfDay(filters.to!) : undefined;

        if (filters.from && endDate) {
            const start = startOfDay(filters.from);
            collection = db.sales.where('createdAt').between(start, endDate, true, true);
        } else if (filters.from) {
            collection = db.sales.where('createdAt').aboveOrEqual(startOfDay(filters.from));
        } else if (endDate) {
            collection = db.sales.where('createdAt').belowOrEqual(endDate);
        }

        let sales = await collection.toArray();

        // FIX: Exclude soft-deleted (cancelled) sales from normal results
        sales = sales.filter(s => !s.isCancelled);

        if (filters.status && filters.status !== 'all') {
            sales = sales.filter(s => s.paymentStatus === filters.status);
        }

        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase().trim();
            const customers = await db.customers.toArray();
            const customerUuids = new Set(
                customers
                    .filter(c => (c.firstName + ' ' + c.lastName).toLowerCase().includes(lowerQuery))
                    .map(c => c.uuid)
            );
            sales = sales.filter(
                s =>
                    s.invoiceNumber.toLowerCase().includes(lowerQuery) ||
                    (s.customerUuid && customerUuids.has(s.customerUuid)),
            );
        }

        return sales.sort(
            (a, b) => safeToDate(b.createdAt!).getTime() - safeToDate(a.createdAt!).getTime()
        );
    }

    /**
     * Génère le prochain numéro de facture.
     * DOIT être appelé UNIQUEMENT depuis l'intérieur d'une db.transaction()
     * pour garantir l'atomicité et éviter les race conditions.
     */
    private async generateInvoiceNumber(): Promise<string> {
        const now = new Date();
        const year = now.getFullYear();
        const profile = await db.company_profile.toCollection().first();
        const currentCounter = profile?.invoice_counter ?? 1;
        const prefix = profile?.invoice_prefix || String(year);
        const invoiceNumber = `${prefix}-${String(currentCounter).padStart(6, '0')}`;

        if (profile?.id) {
            await db.company_profile.update(profile.id, {
                invoice_counter: currentCounter + 1,
                updatedAt: new Date(),
            });
        }
        return invoiceNumber;
    }

    async createSale(saleData: {
        items: CartItem[];
        discountType: 'fixed' | 'percentage';
        discountValue: number;
        amountPaid: number;
        customerUuid?: string | null;
        dueDate?: Date;
    }): Promise<Sale> {
        const now = new Date();
        const subtotalCents = saleData.items.reduce(
            (acc, item) => acc + Math.round(preciseMultiply(item.price, item.cartQuantity) * 100),
            0,
        );

        let discountCents = 0;
        if (saleData.discountType === 'percentage') {
            discountCents = Math.round((subtotalCents * safeNumber(saleData.discountValue)) / 100);
        } else {
            discountCents = Math.round(safeNumber(saleData.discountValue) * 100);
        }

        const totalCents = Math.max(0, subtotalCents - discountCents);
        const amountPaidCents = Math.round(safeNumber(saleData.amountPaid) * 100);
        const remainingCents = Math.max(0, totalCents - amountPaidCents);

        const paymentStatus: Sale['paymentStatus'] =
            Math.abs(remainingCents) < 1 ? 'paid' :
            amountPaidCents > 0            ? 'partial' : 'unpaid';

        const profile = await db.company_profile.toCollection().first();

        const saleItems: SaleItem[] = saleData.items.map(item => ({
            productUuid: item.uuid.startsWith('custom-') ? null : item.uuid,
            name: item.name,
            price: safeNumber(item.price),
            purchasePrice: safeNumber(item.purchasePrice),
            quantity: safeNumber(item.cartQuantity),
            tva_rate: profile?.tva_rate || 19,
        }));

        let invoiceNumber = '';
        const newSale: Sale = {
            uuid: uuidv4(),
            invoiceNumber,
            items: saleItems,
            subtotal: subtotalCents / 100,
            discountType: saleData.discountType,
            discountAmount: discountCents / 100,
            total: totalCents / 100,
            amountPaid: amountPaidCents / 100,
            remainingBalance: remainingCents / 100,
            paymentStatus,
            customerUuid: saleData.customerUuid || undefined,
            createdAt: now,
            updatedAt: now,
            dueDate: saleData.dueDate,
        };

        // CRITICAL FIX: The transaction scope must include ALL tables used by child services.
        // customerService.recalculateCustomerStatus uses 'payments' and 'product_returns'.
        await db.transaction('rw', [
            db.sales, 
            db.products, 
            db.inventory_logs, 
            db.customers, 
            db.company_profile,
            db.payments,
            db.product_returns
        ], async () => {
            invoiceNumber = await this.generateInvoiceNumber();
            newSale.invoiceNumber = invoiceNumber;
            await db.sales.add(newSale);
            for (const item of saleData.items) {
                await inventoryService.adjustStock(item.uuid, -item.cartQuantity, 'sale', newSale.uuid);
            }
            if (newSale.customerUuid) {
                await customerService.recalculateCustomerStatus(newSale.customerUuid);
            }
        });

        triggerSync();

        return newSale;
    }

    /**
     * Annule une vente.
     * FIX: Soft-delete — la vente est marquée isCancelled + cancelledAt au lieu d'être supprimée.
     * Cela préserve la piste d'audit comptable et empêche la perte de données irréversible.
     */
    async processSaleCancellation(uuid: string): Promise<void> {
        await db.transaction('rw', [db.sales, db.products, db.customers, db.inventory_logs, db.payments, db.product_returns], async () => {
            const sale = await this.getSaleByUuid(uuid);
            if (!sale || !sale.id) throw new Error('Vente non trouvée.');
            if (sale.isCancelled) throw new Error('Cette vente est déjà annulée.');

            // FIX: Soft-delete au lieu de db.sales.delete()
            await db.sales.update(sale.id, {
                isCancelled: true,
                cancelledAt: new Date(),
                updatedAt: new Date(),
            });

            // Réintégrer le stock
            for (const item of sale.items) {
                if (item.productUuid) {
                    await inventoryService.adjustStock(item.productUuid, item.quantity, 'cancellation', sale.uuid);
                }
            }
            if (sale.customerUuid) {
                await customerService.recalculateCustomerStatus(sale.customerUuid);
            }
        });

        triggerSync();
    }
}

export const salesService = new SalesService();