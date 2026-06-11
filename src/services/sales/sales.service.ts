'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Sale, CartItem, SaleItem } from '@/lib/types';
import { db } from '@/lib/db';
import { inventoryService } from '../inventory.service';
import { customerService } from '../customers/customer.service';
import { safeToDate, safeNumber, preciseMultiply } from '@/lib/utils';
import { startOfDay, endOfDay } from 'date-fns';

class SalesService {
    async getSaleByUuid(uuid: string): Promise<Sale | undefined> {
        return db.sales.where('uuid').equals(uuid).first();
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
        const profile = await db.company_profile.toCollection().first();
        
        // Calculate totals in cents for precision
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
            tva_rate: profile?.tva_rate || 19,
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

        await db.transaction('rw', [db.sales, db.products, db.inventory_logs, db.customers, db.company_profile, db.sync_queue], async () => {
            await db.sales.add(newSale);
            for (const item of saleData.items) {
                if (item.uuid && !item.uuid.startsWith('custom-')) {
                    await inventoryService.adjustStock(item.uuid, -item.cartQuantity, 'sale', newSale.uuid);
                }
            }
            if (newSale.customerUuid) {
                await customerService.recalculateCustomerStatus(newSale.customerUuid);
            }
            await db.sync_queue.add({ table: 'sales', operation: 'CREATE', payload: newSale, timestamp: Date.now() });
        });

        return newSale;
    }

    private async generateInvoiceNumber(): Promise<string> {
        const profile = await db.company_profile.toCollection().first();
        const currentCounter = profile?.invoice_counter ?? 1;
        const prefix = profile?.invoice_prefix || 'FAC';
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
