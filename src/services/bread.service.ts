'use client';

import { parseISO, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { BreadOrder, BreadOrderWithCustomer, CreateBreadOrderDTO } from '@/lib/types';
import { db } from '@/lib/db';
import { salesService } from './sales.service';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { roundFinancial, roundQty, safeNumber } from '@/lib/utils';

/**
 * Bread Logistics Service — Elite Grade.
 * Managed automated daily distribution and financial conversion.
 * PRODUCTION AUDIT: Fixed data mapping for sale conversion and ensured atomic transactions.
 */
class BreadService {

    private async generateOrderNumber(): Promise<string> {
        return await db.transaction('rw', [db.company_profile], async () => {
            const profile = await db.company_profile.toCollection().first();
            const currentCounter = profile?.breadCounter || 1;
            const number = `BRD-${String(currentCounter).padStart(6, '0')}`;
            
            if (profile?.id) {
                await db.company_profile.update(profile.id, {
                    breadCounter: currentCounter + 1,
                    updatedAt: new Date()
                });
            }
            return number;
        });
    }

    async getOrdersForDate(date: string): Promise<BreadOrderWithCustomer[]> {
        if (!date) return [];

        const orders = await db.bread_orders
            .where('date').equals(date)
            .filter(o => !o.deletedAt)
            .toArray();

        const customerUuids = Array.from(new Set(orders.map(o => o.customerUuid).filter(Boolean) as string[]));
        const customers = customerUuids.length > 0
            ? await db.customers.where('uuid').anyOf(customerUuids).toArray()
            : [];
        const customerMap = new Map(customers.map(c => [c.uuid, c]));

        return orders.map(o => ({
            ...o,
            customer: o.customerUuid ? customerMap.get(o.customerUuid) || null : null,
        })).sort((a, b) => a.orderNumber.localeCompare(b.orderNumber));
    }

    async ensureOrdersForDate(date: string): Promise<void> {
        if (!date) return;
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        if (date < todayStr) return;

        const activeBreadClientsCount = await db.customers
            .filter(c => !!c.isBreadClient && !c.deletedAt)
            .count();
        
        const existingCount = await db.bread_orders
            .where('date').equals(date)
            .filter(o => !o.deletedAt)
            .count();

        if (activeBreadClientsCount > 0 && existingCount === 0) {
            await this.createDayOrders(date);
        }
    }

    async addManualBreadOrder(data: CreateBreadOrderDTO): Promise<void> {
        const profile = await db.company_profile.toCollection().first();
        const price = data.unitPrice || profile?.breadPrice || 10;
        const qty = roundQty(Math.max(0, data.quantity));
        const total = roundFinancial(qty * price);

        const newOrder: BreadOrder = {
            uuid: uuidv4(),
            orderNumber: await this.generateOrderNumber(),
            customerUuid: data.customerUuid || null,
            customName: data.customName,
            date: data.date,
            pickupDate: parseISO(data.date),
            pickupTime: data.pickupTime,
            quantity: qty,
            unitPrice: price,
            totalAmount: total,
            amountPaid: 0,
            remainingAmount: total,
            paymentStatus: 'unpaid',
            pickupStatus: 'unreceived',
            isDelivered: false,
            isPaid: false,
            transferredToCustomerAccount: false,
            saleUuid: null,
            syncStatus: 'pending',
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            notes: data.notes
        };

        await db.bread_orders.add(newOrder);
    }

    async convertBreadOrdersToSales(orderUuids: string[], breadPrice: number): Promise<void> {
        if (orderUuids.length === 0) return;

        // Scope updated to include all tables needed for recalculateCustomerStatus within salesService.createSale
        await db.transaction('rw', [
          db.bread_orders, db.sales, db.products, 
          db.inventory_logs, db.customers, db.company_profile, 
          db.sync_queue, db.payments, db.product_returns
        ], async () => {
            const orders = await db.bread_orders.where('uuid').anyOf(orderUuids).toArray();
            
            for (const order of orders) {
                if (order.saleUuid || order.deletedAt) continue;

                // FIX: map `quantity` to `cartQuantity` for Sale Service expectations
                const sale = await salesService.createSale({
                    items: [{
                        uuid: 'BREAD_VIRTUAL_PROD',
                        name: `Pain - Commande ${order.orderNumber}`,
                        price: breadPrice || order.unitPrice,
                        purchasePrice: 0,
                        cartQuantity: safeNumber(order.quantity), 
                        quantity: safeNumber(order.quantity),
                        barcodes: [],
                        minStockLevel: 0,
                        stockStatus: 'in_stock',
                        syncStatus: 'synced',
                        version: 1,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    } as any],
                    discountType: 'fixed',
                    discountValue: 0,
                    amountPaid: order.isPaid ? roundFinancial(order.quantity * (breadPrice || order.unitPrice)) : 0,
                    customerUuid: order.customerUuid || undefined,
                });

                if (sale) {
                    await db.bread_orders.update(order.id!, {
                        saleUuid: sale.uuid,
                        transferredToCustomerAccount: true,
                        transferredAt: new Date(),
                        updatedAt: new Date(),
                        syncStatus: 'pending'
                    });
                }
            }
        });
    }

    private async createDayOrders(date: string): Promise<void> {
        const dayIndex = parseISO(date).getDay();
        const dayOfWeek = BREAD_WEEK_DAYS[dayIndex];
        const profile = await db.company_profile.toCollection().first();
        const unitPrice = profile?.breadPrice || 0;

        const activeBreadClients = await db.customers
            .filter(c => !!c.isBreadClient && !c.deletedAt)
            .toArray();

        const ordersToCreate: BreadOrder[] = [];

        for (const client of activeBreadClients) {
            if (client.breadProfile?.startDate && date < client.breadProfile.startDate) continue;
            
            let quantity = 0;
            const pref = client.breadProfile;
            
            if (pref?.recurrenceType === 'quotidien') {
                quantity = pref.defaultQuantity || 0;
            } else if (
                pref?.recurrenceType === 'jours_specifiques' &&
                pref.weeklySchedule?.[dayOfWeek]?.actif
            ) {
                quantity = pref.weeklySchedule[dayOfWeek].quantite || 0;
            }

            if (quantity > 0) {
                const total = roundFinancial(quantity * unitPrice);
                ordersToCreate.push({
                    uuid: uuidv4(),
                    orderNumber: `PENDING-${uuidv4().substring(0, 8)}`, 
                    customerUuid: client.uuid,
                    date,
                    pickupDate: parseISO(date),
                    quantity: roundQty(quantity),
                    unitPrice,
                    totalAmount: total,
                    amountPaid: 0,
                    remainingAmount: total,
                    paymentStatus: 'unpaid',
                    pickupStatus: 'unreceived',
                    isDelivered: false,
                    isPaid: false,
                    transferredToCustomerAccount: false,
                    saleUuid: null,
                    syncStatus: 'pending',
                    version: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }

        if (ordersToCreate.length > 0) {
            await db.transaction('rw', [db.bread_orders, db.company_profile], async () => {
                for(let o of ordersToCreate) {
                    o.orderNumber = await this.generateOrderNumber();
                }
                await db.bread_orders.bulkAdd(ordersToCreate);
            });
        }
    }

    async bulkUpdateDeliveryStatus(uuids: string[], isDelivered: boolean): Promise<void> {
        if (uuids.length === 0) return;
        await db.transaction('rw', [db.bread_orders], async () => {
            const orders = await db.bread_orders.where('uuid').anyOf(uuids).toArray();
            for (const order of orders) {
                if (order.saleUuid || order.deletedAt) continue;
                await db.bread_orders.update(order.id!, {
                    isDelivered,
                    pickupStatus: isDelivered ? 'received' : 'unreceived',
                    updatedAt: new Date(),
                    syncStatus: 'pending'
                });
            }
        });
    }

    async updateBreadOrderQuantity(uuid: string, newQuantity: number): Promise<void> {
        const qty = roundQty(Math.max(0, newQuantity));
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.saleUuid) return;

        const total = roundFinancial(qty * order.unitPrice);
        await db.bread_orders.update(order.id!, {
            quantity: qty,
            totalAmount: total,
            remainingAmount: Math.max(0, total - order.amountPaid),
            updatedAt: new Date(),
            syncStatus: 'pending'
        });
    }

    async deleteBreadOrder(uuid: string): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.saleUuid) {
            throw new Error("Impossible de supprimer une commande déjà facturée.");
        }
        await db.bread_orders.update(order.id!, { 
            deletedAt: new Date(), 
            updatedAt: new Date(),
            syncStatus: 'pending'
        });
    }

    async updatePaymentStatus(uuid: string, isPaid: boolean): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.saleUuid) return;

        await db.bread_orders.update(order.id!, {
            isPaid,
            paymentStatus: isPaid ? 'paid' : 'unpaid',
            updatedAt: new Date(),
            syncStatus: 'pending'
        });
    }

    async processEndOfDayTransfers(): Promise<number> {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const profile = await db.company_profile.toCollection().first();
        const price = profile?.breadPrice || 10;
        
        const pendingOrders = await db.bread_orders
            .filter(o => 
                !o.deletedAt && 
                !o.transferredToCustomerAccount && 
                o.date < todayStr
            )
            .toArray();

        if (pendingOrders.length === 0) return 0;
        const uuids = pendingOrders.map(o => o.uuid);
        await this.convertBreadOrdersToSales(uuids, price);
        return uuids.length;
    }
}

export const breadService = new BreadService();