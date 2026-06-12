'use client';

import { v4 as uuidv4 } from 'uuid';
import type { ProductReturn, ReturnItem } from '@/lib/types';
import { db } from '@/lib/db';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { useAppStore } from '@/stores/appStore';

const triggerSync = () => {
    if (typeof window !== 'undefined') {
        const state = useAppStore.getState();
        if (state && state.actions) {
            state.actions.triggerSmartSync();
        }
    }
};

class ReturnService {

    async getReturnByUuid(uuid: string): Promise<ProductReturn | undefined> {
        return db.product_returns.where('uuid').equals(uuid).first();
    }

    async filterReturns(filters: {
        query?: string;
        from?: Date;
        to?: Date;
    }): Promise<ProductReturn[]> {
        let collection = db.product_returns.toCollection();
        if (filters.from)
            collection = collection.filter(r => new Date(r.createdAt!) >= filters.from!);
        if (filters.to)
            collection = collection.filter(r => new Date(r.createdAt!) <= filters.to!);
        let returns = await collection.toArray();
        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase();
            returns = returns.filter(r =>
                r.originalInvoiceNumber.toLowerCase().includes(lowerQuery),
            );
        }
        returns.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
        return returns;
    }

    async addReturn(returnData: {
        originalSaleUuid: string;
        items: ReturnItem[];
        totalReturnValue: number;
        amountRefunded: number;
        customerUuid?: string;
        notes?: string;
    }): Promise<ProductReturn> {
        const sale = await db.sales.where('uuid').equals(returnData.originalSaleUuid).first();
        if (!sale) throw new Error('La vente originale est introuvable.');

        for (const returnItem of returnData.items) {
            if (!returnItem.productUuid) continue;
            const saleItem = sale.items.find(i => i.productUuid === returnItem.productUuid);
            if (saleItem && returnItem.quantity > saleItem.quantity) {
                throw new Error(
                    `Quantité retournée (${returnItem.quantity}) dépasse la quantité vendue (${saleItem.quantity}) pour "${returnItem.productName}".`
                );
            }
        }

        const now = new Date();
        const newReturn: ProductReturn = {
            uuid: uuidv4(),
            originalSaleUuid: returnData.originalSaleUuid,
            originalInvoiceNumber: sale.invoiceNumber,
            items: returnData.items,
            totalReturnValue: returnData.totalReturnValue,
            amountRefunded: returnData.amountRefunded,
            customerUuid: returnData.customerUuid,
            createdAt: now,
            updatedAt: now,
            notes: returnData.notes,
            syncStatus: 'pending',
            version: 1
        };

        await db.transaction('rw', [
            db.product_returns, db.products, db.inventory_logs,
            db.customers, db.sales, db.payments, db.sync_queue
        ], async () => {
            const id = await db.product_returns.add(newReturn);
            newReturn.id = id;

            for (const item of returnData.items) {
                if (item.wasRestocked && item.productUuid) {
                    await inventoryService.adjustStock(
                        item.productUuid,
                        item.quantity,
                        'return',
                        newReturn.uuid,
                    );
                }
            }

            if (returnData.customerUuid) {
                await customerService.recalculateCustomerStatus(returnData.customerUuid);
            }

            await db.sync_queue.add({
                table: 'product_returns',
                operation: 'CREATE',
                payload: newReturn,
                timestamp: Date.now()
            });
        });

        triggerSync();

        return newReturn;
    }

    async processReturnCancellation(uuid: string): Promise<void> {
        await db.transaction('rw', [
            db.product_returns, db.products, db.customers,
            db.inventory_logs, db.sales, db.payments, db.sync_queue
        ], async () => {
            const productReturn = await this.getReturnByUuid(uuid);
            if (!productReturn || !productReturn.id) throw new Error('Retour non trouvé.');
            
            await db.product_returns.delete(productReturn.id);
            
            for (const item of productReturn.items) {
                if (item.wasRestocked && item.productUuid) {
                    await inventoryService.adjustStock(
                        item.productUuid, -item.quantity, 'cancellation', productReturn.uuid,
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

        triggerSync();
    }
}

export const returnService = new ReturnService();
