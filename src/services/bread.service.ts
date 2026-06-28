'use client';

import { parseISO, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { BreadOrder, BreadOrderWithCustomer, CreateBreadOrderDTO } from '@/lib/types';
import { db } from '@/lib/db';
import { salesService } from './sales.service';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { useAppStore } from '@/stores/appStore';
import { roundFinancial, roundQty } from '@/lib/utils';

class BreadService {

    private triggerSync() {
        if (typeof window !== 'undefined') {
            const state = useAppStore.getState();
            if (state?.actions?.triggerSmartSync) {
                state.actions.triggerSmartSync();
            }
        }
    }

    private async generateOrderNumber(): Promise<string> {
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
        this.triggerSync();
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
        this.triggerSync();
    }

    async bulkUpdateDeliveryStatus(uuids: string[], isDelivered: boolean): Promise<void> {
        if (uuids.length === 0) return;
        await db.transaction('rw', [db.bread_orders, db.sync_queue], async () => {
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
                if (order.saleUuid || order.deletedAt) continue;

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
                    amountPaid: order.isPaid ? roundFinancial(order.quantity * breadPrice) : 0,
                    customerUuid: order.customerUuid || undefined,
                });

                await db.bread_orders.update(order.id!, {
                    saleUuid: sale.uuid,
                    paymentStatus: 'paid',
                    isPaid: true,
                    transferredToCustomerAccount: true,
                    transferredAt: new Date(),
                    updatedAt: new Date(),
                    syncStatus: 'pending'
                });
            }
        });

        this.triggerSync();
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
        this.triggerSync();
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
        this.triggerSync();
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
                    orderNumber: await this.generateOrderNumber(),
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
            await db.bread_orders.bulkAdd(ordersToCreate);
            this.triggerSync();
        }
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