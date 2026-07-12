'use client';

import { parseISO, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { BreadOrder, BreadOrderWithCustomer, CreateBreadOrderDTO, BreadPickupStatus, BreadPaymentStatus } from '@/lib/types';
import { db } from '@/lib/db';
import { salesService } from './sales.service';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { roundFinancial, roundQty, safeNumber } from '@/lib/utils';

/**
 * Bread Logistics Service — Enterprise Grade.
 * Managed automated daily distribution and financial conversion with transaction safety.
 */
class BreadService {

    /**
     * Génère un numéro de commande séquentiel unique.
     */
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

    /**
     * Récupère les ordres pour une date spécifique avec jointure client optimisée.
     */
    async getOrdersForDate(date: string): Promise<BreadOrderWithCustomer[]> {
        if (!date) return [];

        const orders = await db.bread_orders
            .where('date').equals(date)
            .filter(o => !o.deletedAt)
            .toArray();

        if (orders.length === 0) return [];

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

    /**
     * Garantit la création des ordres pour les abonnés à une date donnée.
     */
    async ensureOrdersForDate(date: string): Promise<void> {
        if (!date) return;
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        if (date < todayStr) return;

        await db.transaction('rw', [db.bread_orders, db.customers, db.company_profile, db.sync_queue], async () => {
            const existingCount = await db.bread_orders
                .where('date').equals(date)
                .filter(o => !o.deletedAt)
                .count();

            if (existingCount === 0) {
                await this.createDayOrders(date);
            }
        });
    }

    /**
     * Ajoute un ordre manuel hors abonnement.
     */
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
            paymentStatus: 'unpaid' as BreadPaymentStatus,
            pickupStatus: 'unreceived' as BreadPickupStatus,
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

        await db.transaction('rw', [db.bread_orders, db.sync_queue, db.company_profile], async () => {
            await db.bread_orders.add(newOrder);
            await db.sync_queue.add({
                table: 'bread_orders',
                operation: 'CREATE',
                payload: newOrder,
                timestamp: Date.now()
            });
        });
    }

    /**
     * Convertit des ordres en ventes réelles.
     */
    async convertBreadOrdersToSales(orderUuids: string[], breadPrice: number): Promise<void> {
        if (orderUuids.length === 0) return;

        await db.transaction('rw', [
          db.bread_orders, db.sales, db.products, 
          db.inventory_logs, db.customers, db.company_profile, 
          db.sync_queue, db.payments, db.product_returns, db.suppliers,
          db.supplier_payments, db.stock_intakes
        ], async () => {
            const orders = await db.bread_orders.where('uuid').anyOf(orderUuids).toArray();
            
            for (const order of orders) {
                if (order.saleUuid || order.deletedAt || !order.customerUuid) continue;

                const sale = await salesService.createSale({
                    items: [{
                        uuid: 'BREAD_VIRTUAL_PROD',
                        name: `Flux Pain - Ref ${order.orderNumber}`,
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
                    customerUuid: order.customerUuid,
                });

                if (sale) {
                    await db.bread_orders.update(order.id!, {
                        saleUuid: sale.uuid,
                        transferredToCustomerAccount: true,
                        transferredAt: new Date(),
                        updatedAt: new Date(),
                        syncStatus: 'pending' as const
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
                const orderUuid = uuidv4();
                const orderNumber = await this.generateOrderNumber();
                
                const newOrder: BreadOrder = {
                    uuid: orderUuid,
                    orderNumber,
                    customerUuid: client.uuid,
                    date,
                    pickupDate: parseISO(date),
                    quantity: roundQty(quantity),
                    unitPrice,
                    totalAmount: total,
                    amountPaid: 0,
                    remainingAmount: total,
                    paymentStatus: 'unpaid' as BreadPaymentStatus,
                    pickupStatus: 'unreceived' as BreadPickupStatus,
                    isDelivered: false,
                    isPaid: false,
                    transferredToCustomerAccount: false,
                    saleUuid: null,
                    syncStatus: 'pending',
                    version: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await db.bread_orders.add(newOrder);
                await db.sync_queue.add({
                    table: 'bread_orders',
                    operation: 'CREATE',
                    payload: newOrder,
                    timestamp: Date.now()
                });
            }
        }
    }

    async bulkUpdateDeliveryStatus(uuids: string[], isDelivered: boolean): Promise<void> {
        if (uuids.length === 0) return;
        await db.transaction('rw', [db.bread_orders, db.sync_queue], async () => {
            const orders = await db.bread_orders.where('uuid').anyOf(uuids).toArray();
            for (const order of orders) {
                if (order.saleUuid || order.deletedAt) continue;
                const update = {
                    isDelivered,
                    pickupStatus: isDelivered ? ('received' as BreadPickupStatus) : ('unreceived' as BreadPickupStatus),
                    updatedAt: new Date(),
                    syncStatus: 'pending' as const
                };
                await db.bread_orders.update(order.id!, update);
                await db.sync_queue.add({
                    table: 'bread_orders',
                    operation: 'UPDATE',
                    payload: { ...order, ...update },
                    timestamp: Date.now()
                });
            }
        });
    }

    async updateBreadOrderQuantity(uuid: string, newQuantity: number): Promise<void> {
        const qty = roundQty(Math.max(0, newQuantity));
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.saleUuid) return;

        const total = roundFinancial(qty * order.unitPrice);
        const update = {
            quantity: qty,
            totalAmount: total,
            remainingAmount: Math.max(0, total - order.amountPaid),
            updatedAt: new Date(),
            syncStatus: 'pending' as const
        };

        await db.transaction('rw', [db.bread_orders, db.sync_queue], async () => {
            await db.bread_orders.update(order.id!, update);
            await db.sync_queue.add({
                table: 'bread_orders',
                operation: 'UPDATE',
                payload: { ...order, ...update },
                timestamp: Date.now()
            });
        });
    }

    async deleteBreadOrder(uuid: string): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.saleUuid) {
            throw new Error("Impossible de supprimer une commande déjà facturée.");
        }
        
        await db.transaction('rw', [db.bread_orders, db.sync_queue], async () => {
            await db.bread_orders.update(order.id!, { 
                deletedAt: new Date(), 
                updatedAt: new Date(),
                syncStatus: 'pending' as const
            });
            await db.sync_queue.add({
                table: 'bread_orders',
                operation: 'DELETE',
                payload: { uuid },
                timestamp: Date.now()
            });
        });
    }

    async updatePaymentStatus(uuid: string, isPaid: boolean): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.saleUuid) return;

        const update = {
            isPaid,
            paymentStatus: isPaid ? ('paid' as BreadPaymentStatus) : ('unpaid' as BreadPaymentStatus),
            updatedAt: new Date(),
            syncStatus: 'pending' as const
        };

        await db.transaction('rw', [db.bread_orders, db.sync_queue], async () => {
            await db.bread_orders.update(order.id!, update);
            await db.sync_queue.add({
                table: 'bread_orders',
                operation: 'UPDATE',
                payload: { ...order, ...update },
                timestamp: Date.now()
            });
        });
    }

    async processEndOfDayTransfers(): Promise<number> {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        const pendingOrders = await db.bread_orders
            .filter(o => 
                !o.deletedAt && 
                !o.transferredToCustomerAccount && 
                !!o.customerUuid &&
                o.date < todayStr
            )
            .toArray();

        if (pendingOrders.length === 0) return 0;
        
        const profile = await db.company_profile.toCollection().first();
        const price = profile?.breadPrice || 10;
        
        const uuids = pendingOrders.map(o => o.uuid);
        await this.convertBreadOrdersToSales(uuids, price);
        return uuids.length;
    }
}

export const breadService = new BreadService();
