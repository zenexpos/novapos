'use client';

import { parseISO, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { BreadOrder, BreadOrderWithCustomer, InventoryLog, InventoryLogReason } from '@/lib/types';
import { db } from '@/lib/db';
import { salesService } from './sales.service';
import { customerService } from './customer.service';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { useAppStore } from '@/stores/appStore';
import { roundFinancial } from '@/lib/utils';

/**
 * iPOS Zen - Bread Distribution Domain Service.
 * Gère le cycle de vie des commandes de pain, la facturation différée et la logistique.
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

    /**
     * Génère un numéro de commande séquentiel unique.
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
     * Récupère les commandes pour une date spécifique avec jointure client.
     */
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

    /**
     * Assure que les commandes automatiques sont générées pour une date donnée.
     */
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
            if (client.bread_date_debut && date < client.bread_date_debut) continue;
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
            this.triggerSync();
        }
    }

    /**
     * Traite le transfert automatique des commandes non soldées vers les comptes courants.
     */
    async processEndOfDayTransfers(): Promise<number> {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
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
        await db.transaction('rw', [
            db.bread_orders, db.sales, db.customers, 
            db.inventory_logs, db.products, db.payments, 
            db.product_returns, db.sync_queue, db.company_profile
        ], async () => {
            const sale = await salesService.createSale({
                items: [{
                    productUuid: null,
                    name: `Reliquat Pain #${order.orderNumber}`,
                    price: order.unitPrice,
                    purchasePrice: 0,
                    quantity: order.quantity
                } as any],
                discountType: 'fixed',
                discountValue: 0,
                amountPaid: order.amountPaid,
                customerUuid: order.customerUuid || undefined,
            });

            await db.bread_orders.update(order.id!, {
                transferredToCustomerAccount: true,
                transferredAt: new Date(),
                venteUuid: sale.uuid,
                updatedAt: new Date()
            });

            await db.inventory_logs.add({
                uuid: uuidv4(),
                productUuid: null,
                change: 0,
                newQuantity: 0,
                reason: 'manual_adjustment',
                details: `Transfert Auto Pain #${order.orderNumber}`,
                relatedUuid: order.uuid,
                createdAt: new Date(),
                updatedAt: new Date(),
                syncStatus: 'pending',
                version: 1
            });
        });
    }

    async updateStatuses(uuid: string, updates: { 
        paymentStatus?: BreadOrder['paymentStatus'], 
        pickupStatus?: BreadOrder['pickupStatus']
    }): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.deletedAt) return;

        const newUpdates: Partial<BreadOrder> = { ...updates, updatedAt: new Date() };

        if (updates.paymentStatus === 'paid') {
            newUpdates.amountPaid = order.totalAmount;
            newUpdates.remainingAmount = 0;
        }

        await db.bread_orders.update(order.id!, newUpdates);
        this.triggerSync();
    }

    async deleteOrder(uuid: string): Promise<void> {
        const order = await db.bread_orders.where('uuid').equals(uuid).first();
        if (!order || order.transferredToCustomerAccount) {
            throw new Error("Impossible de supprimer une commande déjà transférée en compte.");
        }
        await db.bread_orders.update(order.id!, { deletedAt: new Date() });
        this.triggerSync();
    }
}

export const breadService = new BreadService();
