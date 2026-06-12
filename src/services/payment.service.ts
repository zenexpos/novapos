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

class PaymentService {

    /**
     * Enregistre un nouveau versement client avec garantie d'atomicité.
     * Injecte les métadonnées de synchronisation hors-ligne.
     */
    async addPayment(input: PaymentCreateInput): Promise<void> {
        const { customerUuid, notes } = input;

        const amount = roundFinancial(safeNumber(input.amount));
        if (amount <= 0) throw new Error('Le montant du paiement doit être positif.');

        const paymentDate = safeToDate(input.paymentDate);
        if (paymentDate.getTime() === 0) throw new Error('Date de paiement invalide.');

        const customer = await db.customers.where('uuid').equals(customerUuid).first();
        if (!customer) throw new Error('Client non trouvé.');

        const now = new Date();
        
        // FACTORY LOGIC: Encapsulation de la création de l'entité
        const newPayment: Payment = {
            uuid: uuidv4(),
            customerUuid,
            amount,
            paymentDate,
            notes: notes || undefined,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            version: 1
        };

        await db.transaction('rw', [db.payments, db.customers, db.sales, db.product_returns, db.sync_queue], async () => {
            await db.payments.add(newPayment);
            
            // Audit client
            await customerService.recalculateCustomerStatus(customerUuid);

            // Mise en file d'attente de synchronisation
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
