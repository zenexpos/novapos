'use client';
/**
 * @fileOverview Service de gestion des retours marchandise.
 * Audit Zero Defect : Sécurisation des transactions et recalcul automatique des soldes.
 * Directive 'use client' requise pour l'accès direct à IndexedDB.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ProductReturn, ReturnItem, ReturnCreateInput } from '@/lib/types';
import { db } from '@/lib/db';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { roundFinancial } from '@/lib/utils';

class ReturnService {

    async getReturnByUuid(uuid: string): Promise<ProductReturn | undefined> {
        return db.product_returns.where('uuid').equals(uuid).first();
    }

    /**
     * Enregistre un retour marchandise.
     * Transaction atomique incluant : Stock, Solde Client, Logs et File de Sync.
     */
    async addReturn(input: ReturnCreateInput): Promise<ProductReturn> {
        const sale = await db.sales.where('uuid').equals(input.originalSaleUuid).first();
        if (!sale) throw new Error('Vente originale introuvable.');

        const now = new Date();
        const newReturn: ProductReturn = {
            uuid: uuidv4(),
            originalSaleUuid: input.originalSaleUuid,
            originalInvoiceNumber: sale.invoiceNumber,
            items: input.items,
            totalReturnValue: roundFinancial(input.totalReturnValue),
            amountRefunded: roundFinancial(input.amountRefunded),
            customerUuid: input.customerUuid,
            createdAt: now,
            updatedAt: now,
            notes: input.notes,
            syncStatus: 'pending',
            version: 1
        };

        await db.transaction('rw', [
            db.product_returns, db.products, db.inventory_logs,
            db.customers, db.sales, db.payments, db.sync_queue, db.bread_orders, db.company_profile,
            db.suppliers, db.supplier_payments, db.stock_intakes
        ], async () => {
            await db.product_returns.add(newReturn);

            for (const item of input.items) {
                if (item.wasRestocked && item.productUuid) {
                    await inventoryService.adjustStock(
                        item.productUuid,
                        item.quantity,
                        'return',
                        newReturn.uuid,
                        `Retour sur facture #${sale.invoiceNumber}`
                    );
                }
            }

            if (input.customerUuid) {
                await customerService.recalculateCustomerStatus(input.customerUuid);
            }

            await db.sync_queue.add({
                table: 'product_returns',
                operation: 'CREATE',
                payload: newReturn,
                timestamp: Date.now()
            });
        });

        return newReturn;
    }

    async processReturnCancellation(uuid: string): Promise<void> {
        await db.transaction('rw', [
            db.product_returns, db.products, db.customers,
            db.inventory_logs, db.sales, db.payments, db.sync_queue, db.bread_orders, db.company_profile,
            db.suppliers, db.supplier_payments, db.stock_intakes
        ], async () => {
            const productReturn = await this.getReturnByUuid(uuid);
            if (!productReturn || !productReturn.id) throw new Error('Retour introuvable.');
            
            await db.product_returns.delete(productReturn.id);
            
            for (const item of productReturn.items) {
                if (item.wasRestocked && item.productUuid) {
                    await inventoryService.adjustStock(
                        item.productUuid, 
                        -item.quantity, 
                        'cancellation', 
                        productReturn.uuid,
                        `Annulation du retour #${productReturn.originalInvoiceNumber}`
                    );
                }
            }
            
            if (productReturn.customerUuid) {
                await customerService.recalculateCustomerStatus(productReturn.customerUuid);
            }

            await db.sync_queue.add({
                table: 'product_returns',
                operation: 'DELETE',
                payload: { uuid },
                timestamp: Date.now()
            });
        });
    }
}

export const returnService = new ReturnService();
