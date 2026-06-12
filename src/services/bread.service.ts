'use client';

import { parseISO, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { BreadOrder, BreadOrderWithCustomer } from '@/lib/types';
import { db } from '@/lib/db';
import { salesService } from './sales.service';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { useAppStore } from '@/stores/appStore';
import { roundFinancial } from '@/lib/utils';

/**
 * iPOS Zen - Bread Distribution Domain Service.
 * Gère le cycle de vie des commandes de pain avec nommage unifié.
 */
class BreadService {

    private triggerSync() {
        if (typeof window !== 'undefined') {
            const state = useAppStore.getState();
            if (state && state.actions) {
                state.actions.triggerSmartSync();
            }
        }
    }

    private async generateOrderNumber(): Promise<string> {
        const profile = await db.company_profile.toCollection().first();
        const currentCounter = profile?.bread_counter || 1;
        const number = `BRD-${String(currentCounter).padStart(6, '0')}`;
        
        if (profile?.id) {
            await db.company_profile.update(profile.id, {
                bread_counter: currentCounter + 1,
                updatedAt: new Date()
            });
        }
        return number;
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

    async addManualBreadOrder(data: {
        customerUuid?: string;
        customName?: string;
        date: string;
        quantity: number;
        unitPrice?: number;
    }): Promise<void> {
        const profile = await db.company_profile.toCollection().first();
        const price = data.unitPrice || profile?.prix_pain || 10;
        const total = roundFinancial(data.quantity * price);

        const newOrder: BreadOrder = {
            uuid: uuidv4(),
            orderNumber: await this.generateOrderNumber(),
            customerUuid: data.customerUuid || null,
            customName: data.customName,
            date: data.date,
            pickupDate: parseISO(data.date),
            quantity: data.quantity,
            unitPrice: price,
            totalAmount: total,
            amountPaid: 0,
            remainingAmount: total,
            paymentStatus: 'unpaid',
            pickupStatus: 'unreceived',
            isDelivered: false,
            isPaid: false,
            transferredToCustomerAccount: false,
            venteUuid: null,
            syncStatus: 'pending',
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.bread_orders.add(newOrder);
        this.triggerSync();
    }

    async convertBreadOrdersToSales(orderUuids: string[], breadPrice: number): Promise<void> {
        if (orderUuids.length === 0) return;

        await db.transaction('rw', [
            db.bread_orders, db.sales, db.customers, 
            db.inventory_logs, db.products, db.payments, 
            db.product_returns, db.sync_queue, db.company_profile
        ], async () => {
            const orders = await db.bread_orders.where('uuid').anyOf(orderUuids).toArray();
            
            for (const order of orders) {
                if (order.venteUuid || order.deletedAt) continue;

                const sale = await salesService.createSale({
                    items: [{
                        productUuid: 'BREAD_PRODUCT',
                        name: `Pain - Commande ${order.orderNumber}`,
                        price: breadPrice || order.unitPrice,
                        purchasePrice: 0,
                        quantity: order.quantity
                    } as any],
                    discountType: 'fixed',
                    discountValue: 0,
                    amountPaid: order.amountPaid || 0,
                    customerUuid: order.customerUuid || undefined,
                });

                await db.bread_orders.update(order.id!, {
                    venteUuid: sale.uuid,
                    paymentStatus: 'paid',
                    isPaid: true,
                    transferredToCustomerAccount: true,
                    transferredAt: new Date(),
                    updatedAt: new Date()
                });
            }
        });

        this.triggerSync();
    }

    async billAllRemainingOrdersForDate(date: string, breadPrice: number): Promise<number> {
        const pendingOrders = await db.bread_orders
            .where('date').equals(date)
            .filter(o => !o.venteUuid && !o.deletedAt)
            .toArray();

        const uuids = pendingOrders.map(o => o.uuid);
        if (uuids.length > 0) {
            await this.convertBreadOrdersToSales(uuids, breadPrice);
        }
        return uuids.length;
    }

    async updateBreadOrderQuantity(uuid: string, newQuantity: number): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.venteUuid) return;

        const total = roundFinancial(newQuantity * order.unitPrice);
        await db.bread_orders.update(order.id!, {
            quantity: newQuantity,
            totalAmount: total,
            remainingAmount: Math.max(0, total - order.amountPaid),
            updatedAt: new Date()
        });
        this.triggerSync();
    }

    async updateBreadOrderDeliveryStatus(uuid: string, isDelivered: boolean): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order) return;

        await db.bread_orders.update(order.id!, {
            isDelivered,
            pickupStatus: isDelivered ? 'received' : 'unreceived',
            updatedAt: new Date()
        });
        this.triggerSync();
    }

    async deleteBreadOrder(uuid: string): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.venteUuid) {
            throw new Error("Impossible de supprimer une commande facturée.");
        }
        await db.bread_orders.update(order.id!, { deletedAt: new Date(), updatedAt: new Date() });
        this.triggerSync();
    }

    private async createDayOrders(date: string): Promise<void> {
        const dayIndex = parseISO(date).getDay();
        const dayOfWeek = BREAD_WEEK_DAYS[dayIndex];
        const profile = await db.company_profile.toCollection().first();
        const unitPrice = profile?.prix_pain || 0;

        const activeBreadClients = await db.customers
            .filter(c => !!c.isBreadClient && !c.deletedAt)
            .toArray();

        const ordersToCreate: BreadOrder[] = [];

        for (const client of activeBreadClients) {
            if (client.breadStartDate && date < client.breadStartDate) continue;
            if (client.breadRecurrenceType === 'aucun') continue;

            let quantity = 0;
            if (client.breadRecurrenceType === 'quotidien') {
                quantity = client.breadDefaultQuantity || 0;
            } else if (
                client.breadRecurrenceType === 'jours_specifiques' &&
                client.breadWeeklySchedule?.[dayOfWeek]?.actif
            ) {
                quantity = client.breadWeeklySchedule[dayOfWeek].quantite || 0;
            }

            if (quantity > 0) {
                const total = roundFinancial(quantity * unitPrice);
                ordersToCreate.push({
                    uuid: uuidv4(),
                    orderNumber: await this.generateOrderNumber(),
                    customerUuid: client.uuid,
                    date,
                    pickupDate: parseISO(date),
                    quantity,
                    unitPrice,
                    totalAmount: total,
                    amountPaid: 0,
                    remainingAmount: total,
                    paymentStatus: 'unpaid',
                    pickupStatus: 'unreceived',
                    isDelivered: false,
                    isPaid: false,
                    transferredToCustomerAccount: false,
                    venteUuid: null,
                    syncStatus: 'pending',
                    version: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }

        if (ordersToCreate.length > 0) {
            await db.bread_orders.bulkAdd(ordersToCreate);
            this.triggerSync();
        }
    }

    async processEndOfDayTransfers(): Promise<number> {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const profile = await db.company_profile.toCollection().first();
        const price = profile?.prix_pain || 10;
        
        const pendingOrders = await db.bread_orders
            .filter(o => 
                !o.deletedAt && 
                !o.transferredToCustomerAccount && 
                (o.date < todayStr || (o.date === todayStr && new Date().getHours() >= 23))
            )
            .toArray();

        if (pendingOrders.length === 0) return 0;
        const uuids = pendingOrders.map(o => o.uuid);
        await this.convertBreadOrdersToSales(uuids, price);
        return uuids.length;
    }
}

export const breadService = new BreadService();