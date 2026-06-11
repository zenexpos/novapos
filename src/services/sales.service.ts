'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Sale, CartItem, SaleItem } from '@/lib/types';
import { db } from '@/lib/db';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { safeNumber, preciseMultiply, roundFinancial } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

/**
 * iPOS Zen - Master Sales Domain Service.
 * Centralise les transactions de vente avec une garantie d'atomicité.
 */
class SalesService {

    private triggerSync() {
        if (typeof window !== 'undefined') {
            const state = useAppStore.getState();
            if (state && state.actions) {
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

    async filterSales(filters: {
        query?: string;
        status?: string;
        from?: Date;
        to?: Date;
    }): Promise<Sale[]> {
        let collection = db.sales.filter(s => !s.deletedAt);

        if (filters.from) {
            const start = new Date(filters.from).setHours(0,0,0,0);
            const end = new Date(filters.to || filters.from).setHours(23,59,59,999);
            collection = collection.filter(s => {
                const date = new Date(s.createdAt!).getTime();
                return date >= start && date <= end;
            });
        }

        if (filters.status && filters.status !== 'all') {
            collection = collection.filter(s => s.paymentStatus === filters.status);
        }

        let sales = await collection.toArray();

        if (filters.query) {
            const q = filters.query.toLowerCase().trim();
            sales = sales.filter(s => s.invoiceNumber.toLowerCase().includes(q));
        }

        return sales.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }

    /**
     * Crée une vente atomique avec transaction Dexie.
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
        const profile = await db.company_profile.toCollection().first();
        
        // Calcul précision Elite en centimes pour éviter les erreurs d'arrondi JS
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
            amountPaidCents > 0 ? 'partial' : 'unpaid';

        const saleItems: SaleItem[] = saleData.items.map(item => ({
            productUuid: item.uuid.startsWith('custom-') ? null : item.uuid,
            name: item.name,
            price: safeNumber(item.price),
            purchasePrice: safeNumber(item.purchasePrice),
            quantity: safeNumber(item.cartQuantity),
        }));

        const newSale: Sale = {
            uuid: uuidv4(),
            invoiceNumber: await this.generateInvoiceNumber(),
            items: saleItems,
            subtotal: subtotalCents / 100,
            discountAmount: discountCents / 100,
            total: totalCents / 100,
            amountPaid: amountPaidCents / 100,
            remainingBalance: remainingCents / 100,
            paymentStatus,
            customerUuid: saleData.customerUuid || undefined,
            createdAt: now,
            updatedAt: now,
            dueDate: saleData.dueDate,
            syncStatus: 'pending',
            version: 1,
            isCancelled: false
        };

        // TRANSACTION ATOMIQUE ELITE : Stock + Client + Vente + Queue
        await db.transaction('rw', [
            db.sales, db.products, db.inventory_logs, 
            db.customers, db.company_profile, db.sync_queue,
            db.payments, db.product_returns, db.bread_orders
        ], async () => {
            await db.sales.add(newSale);
            
            for (const item of saleData.items) {
                if (item.uuid && !item.uuid.startsWith('custom-')) {
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
            db.sales, db.products, db.inventory_logs, 
            db.customers, db.sync_queue
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
        });

        this.triggerSync();
    }

    private async generateInvoiceNumber(): Promise<string> {
        const profile = await db.company_profile.toCollection().first();
        const currentCounter = profile?.invoice_counter ?? 1;
        const prefix = profile?.invoice_prefix || String(new Date().getFullYear());
        const invoiceNumber = `${prefix}-${String(currentCounter).padStart(6, '0')}`;

        if (profile?.id) {
            await db.company_profile.update(profile.id, {
                invoice_counter: currentCounter + 1,
                updatedAt: new Date()
            });
        }
        return invoiceNumber;
    }
}

export const salesService = new SalesService();
