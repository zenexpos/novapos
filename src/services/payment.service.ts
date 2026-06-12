'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Payment, PaymentCreateInput } from '@/lib/types';
import { db } from '@/lib/db';
import { customerService } from './customer.service';
import { safeNumber, safeToDate, roundFinancial } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

const triggerSync = () => {
    if (typeof window !== 'undefined') {
        const state = useAppStore.getState();
        if (state && state.actions) {
            state.actions.triggerSmartSync();
        }
    }
};

/**
 * Service de gestion des règlements clients.
 * Utilise un Factory Pattern pour garantir l'intégrité des entités Offline-First.
 */
class PaymentService {

    /**
     * FACTORY : Centralise la création d'une entité Payment valide.
     */
    private createPaymentEntity(input: PaymentCreateInput): Payment {
        const now = new Date();
        return {
            uuid: uuidv4(),
            customerUuid: input.customerUuid,
            amount: roundFinancial(safeNumber(input.amount)),
            paymentDate: safeToDate(input.paymentDate),
            notes: input.notes?.trim() || undefined,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            version: 1
        };
    }

    /**
     * Enregistre un nouveau versement client avec garantie d'atomicité.
     */
    async addPayment(input: PaymentCreateInput): Promise<void> {
        if (safeNumber(input.amount) <= 0) throw new Error('Le montant du paiement doit être positif.');

        const customer = await db.customers.where('uuid').equals(input.customerUuid).first();
        if (!customer) throw new Error('Client non trouvé.');

        const newPayment = this.createPaymentEntity(input);

        await db.transaction('rw', [db.payments, db.customers, db.sales, db.product_returns, db.sync_queue], async () => {
            await db.payments.add(newPayment);
            
            // Recalcul du solde client (Audit financier)
            await customerService.recalculateCustomerStatus(input.customerUuid);

            // Inscription dans la file de synchronisation Cloud
            await db.sync_queue.add({ 
                table: 'payments', 
                operation: 'CREATE', 
                payload: newPayment, 
                timestamp: Date.now() 
            });
        });

        triggerSync();
    }

    async deletePayment(uuid: string): Promise<void> {
        const payment = await db.payments.where('uuid').equals(uuid).first();
        if (!payment?.id) throw new Error('Paiement non trouvé.');

        await db.transaction('rw', [db.payments, db.customers, db.sales, db.product_returns, db.sync_queue], async () => {
            await db.payments.delete(payment.id!);
            await customerService.recalculateCustomerStatus(payment.customerUuid);
            
            await db.sync_queue.add({
                table: 'payments',
                operation: 'DELETE',
                payload: { uuid },
                timestamp: Date.now()
            });
        });

        triggerSync();
    }

    async getPaymentsByCustomerUuid(customerUuid: string): Promise<Payment[]> {
        const payments = await db.payments.where('customerUuid').equals(customerUuid).toArray();
        return payments.sort(
            (a, b) => safeToDate(b.paymentDate).getTime() - safeToDate(a.paymentDate).getTime()
        );
    }
}

export const paymentService = new PaymentService();
