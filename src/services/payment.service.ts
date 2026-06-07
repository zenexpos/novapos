'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Payment } from '@/lib/types';
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

    async addPayment(paymentData: {
        customerUuid: string;
        amount: number;
        paymentDate: Date;
        notes?: string;
    }): Promise<void> {
        const { customerUuid, notes } = paymentData;

        // FIX: Validate amount > 0 — prevents recording zero/negative payments
        const amount = roundFinancial(safeNumber(paymentData.amount));
        if (amount <= 0) throw new Error('Le montant du paiement doit être positif.');

        // FIX: Normalize paymentDate with safeToDate — avoids ISO string sort bugs after backup restore
        const paymentDate = safeToDate(paymentData.paymentDate);
        if (paymentDate.getTime() === 0) throw new Error('Date de paiement invalide.');

        const customer = await db.customers.where('uuid').equals(customerUuid).first();
        if (!customer) throw new Error('Client non trouvé.');

        const now = new Date();
        const newPayment: Payment = {
            uuid: uuidv4(),
            customerUuid,
            amount,
            // FIX: Store normalized Date object, not raw string
            paymentDate,
            notes,
            createdAt: now,
            updatedAt: now,
        };

        // FIX: addPayment wrapped in db.transaction — if recalculateCustomerStatus fails,
        // the payment is rolled back. No more orphaned payments with stale customer balance.
        await db.transaction('rw', [db.payments, db.customers, db.sales, db.product_returns], async () => {
            await db.payments.add(newPayment);
            await customerService.recalculateCustomerStatus(customerUuid);
        });

        triggerSync();
    }

    async deletePayment(uuid: string): Promise<void> {
        const payment = await db.payments.where('uuid').equals(uuid).first();
        if (!payment?.id) throw new Error('Paiement non trouvé.');

        await db.transaction('rw', [db.payments, db.customers, db.sales, db.product_returns], async () => {
            await db.payments.delete(payment.id!);
            await customerService.recalculateCustomerStatus(payment.customerUuid);
        });

        triggerSync();
    }

    async getPaymentsByCustomerUuid(customerUuid: string): Promise<Payment[]> {
        // FIX: Sort after toArray() — paymentDate stored as Date object sorts correctly in JS
        // even after backup/restore if safeToDate was applied on addPayment
        const payments = await db.payments.where('customerUuid').equals(customerUuid).toArray();
        return payments.sort(
            (a, b) => safeToDate(b.paymentDate).getTime() - safeToDate(a.paymentDate).getTime()
        );
    }
}

export const paymentService = new PaymentService();
