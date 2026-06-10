'use client';

import { parseISO, format, startOfDay, isBefore, subHours } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { BreadOrder, BreadOrderWithCustomer, InventoryLog } from '@/lib/types';
import { db } from '@/lib/db';
import { salesService } from './sales.service';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { useAppStore } from '@/stores/appStore';
import { roundFinancial } from '@/lib/utils';

const triggerSync = () => {
    if (typeof window !== 'undefined') {
        const state = useAppStore.getState();
        if (state && state.actions) {
            state.actions.triggerSmartSync();
        }
    }
};

class BreadService {

    /**
     * Generate an order number based on sequence.
     */
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

    /**
     * Get or generate orders for a specific date.
     */
    async generateAndGetOrdersForDate(date: string): Promise<BreadOrderWithCustomer[]> {
        if (!date) return [];

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
            if (client.bread_type_recurrence === 'aucun') continue;

            let quantity = 0;
            if (client.bread_type_recurrence === 'quotidien') {
                quantity = client.bread_quantite_defaut || 0;
            } else if (
                client.bread_type_recurrence === 'jours_specifiques' &&
                client.bread_jours_semaine?.[dayOfWeek]?.actif
            ) {
                quantity = client.bread_jours_semaine[dayOfWeek].quantite || 0;
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
            triggerSync();
        }
    }

    async addManualBreadOrder(params: {
        customerUuid?: string;
        customName?: string;
        date: string;
        quantity: number;
        unitPrice: number;
        pickupTime?: string;
    }): Promise<BreadOrder> {
        const total = roundFinancial(params.quantity * params.unitPrice);
        const newOrder: BreadOrder = {
            uuid: uuidv4(),
            orderNumber: await this.generateOrderNumber(),
            customerUuid: params.customerUuid || null,
            customName: params.customName,
            date: params.date,
            pickupDate: parseISO(params.date),
            pickupTime: params.pickupTime,
            quantity: params.quantity,
            unitPrice: params.unitPrice,
            totalAmount: total,
            amountPaid: 0,
            remainingAmount: total,
            paymentStatus: 'unpaid',
            pickupStatus: 'unreceived',
            transferredToCustomerAccount: false,
            venteUuid: null,
            syncStatus: 'pending',
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.bread_orders.add(newOrder);
        await this.logAction(newOrder.uuid, 'manual_adjustment', 'Création manuelle de commande', null, newOrder);
        triggerSync();
        return newOrder;
    }

    async updateStatuses(uuid: string, updates: { 
        paymentStatus?: BreadOrder['paymentStatus'], 
        pickupStatus?: BreadOrder['pickupStatus'],
        amountPaid?: number
    }): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.deletedAt) return;

        const oldValue = { ...order };
        const newUpdates: Partial<BreadOrder> = { ...updates, updatedAt: new Date() };

        // Real-time calculations for payment
        if (updates.paymentStatus === 'paid') {
            newUpdates.amountPaid = order.totalAmount;
            newUpdates.remainingAmount = 0;
        } else if (updates.paymentStatus === 'unpaid') {
            newUpdates.amountPaid = 0;
            newUpdates.remainingAmount = order.totalAmount;
        }

        // Logic if already transferred to account
        if (order.transferredToCustomerAccount && updates.paymentStatus === 'paid') {
            await this.settleDebt(order);
        } else if (order.transferredToCustomerAccount && updates.paymentStatus === 'unpaid') {
            await this.revertDebt(order);
        }

        await db.bread_orders.update(order.id!, newUpdates);
        await this.logAction(uuid, 'bread_order_status_change', 'Mise à jour des statuts', oldValue, { ...order, ...newUpdates });
        triggerSync();
    }

    /**
     * Simulation task: Transfer pending orders to account (Run daily or on demand)
     * Requirement: Daily at 23:00. In PWA we check on start/interaction.
     */
    async processEndOfDayTransfers(): Promise<number> {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        // Find orders from before today or today after 23:00
        const pendingOrders = await db.bread_orders
            .filter(o => 
                !o.deletedAt && 
                !o.transferredToCustomerAccount && 
                (o.date < todayStr || (o.date === todayStr && new Date().getHours() >= 23)) &&
                (o.paymentStatus !== 'paid' || o.pickupStatus === 'received')
            )
            .toArray();

        let count = 0;
        for (const order of pendingOrders) {
            if (order.customerUuid && order.remainingAmount > 0) {
                await this.transferToAccount(order);
                count++;
            }
        }
        return count;
    }

    private async transferToAccount(order: BreadOrder): Promise<void> {
        await db.transaction('rw', [db.bread_orders, db.sales, db.customers, db.inventory_logs, db.products, db.payments, db.sync_queue, db.company_profile], async () => {
            // Create a pseudo-sale to represent the debt
            const sale = await salesService.createSale({
                items: [{
                    uuid: 'BREAD_DEBT',
                    name: `Reliquat Pain #${order.orderNumber}`,
                    price: order.unitPrice,
                    purchasePrice: 0,
                    quantity: order.quantity, // Using quantity as reference
                    cartQuantity: order.quantity,
                    minStockLevel: 0,
                }],
                discountType: 'fixed',
                discountValue: 0,
                amountPaid: order.amountPaid,
                customerUuid: order.customerUuid,
            });

            await db.bread_orders.update(order.id!, {
                transferredToCustomerAccount: true,
                transferredAt: new Date(),
                debtId: sale.uuid,
                venteUuid: sale.uuid,
                updatedAt: new Date()
            });

            await this.logAction(order.uuid, 'bread_order_transfer', 'Transfert automatique au compte client', null, sale.uuid);
        });
    }

    private async settleDebt(order: BreadOrder): Promise<void> {
        if (!order.debtId) return;
        // In iPOSZen, we add a payment for the sale
        // This logic would normally use paymentService
        const sale = await db.sales.where('uuid').equals(order.debtId).first();
        if (sale && sale.paymentStatus !== 'paid') {
             await db.sales.update(sale.id!, {
                amountPaid: sale.total,
                remainingBalance: 0,
                paymentStatus: 'paid',
                updatedAt: new Date()
             });
             // Recalculate customer
             if (order.customerUuid) {
                const { customerService } = await import('./customer.service');
                await customerService.recalculateCustomerStatus(order.customerUuid);
             }
        }
    }

    private async revertDebt(order: BreadOrder): Promise<void> {
        if (!order.debtId) return;
        const sale = await db.sales.where('uuid').equals(order.debtId).first();
        if (sale) {
             await db.sales.update(sale.id!, {
                amountPaid: 0,
                remainingBalance: sale.total,
                paymentStatus: 'unpaid',
                updatedAt: new Date()
             });
             if (order.customerUuid) {
                const { customerService } = await import('./customer.service');
                await customerService.recalculateCustomerStatus(order.customerUuid);
             }
        }
    }

    async deleteOrder(uuid: string): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.transferredToCustomerAccount) {
            throw new Error("Impossible de supprimer un طلب محول للحساب.");
        }

        await db.bread_orders.update(order.id!, { deletedAt: new Date() });
        await this.logAction(uuid, 'manual_adjustment', 'Suppression du طلب', order, null);
        triggerSync();
    }

    private async logAction(relatedUuid: string, reason: InventoryLogReason, details: string, oldValue: any, newValue: any): Promise<void> {
        const log: InventoryLog = {
            uuid: uuidv4(),
            productUuid: null,
            change: 0,
            newQuantity: 0,
            reason,
            details,
            oldValue,
            newValue,
            relatedUuid,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: 'pending',
            version: 1
        };
        await db.inventory_logs.add(log);
    }
}

export const breadService = new BreadService();
