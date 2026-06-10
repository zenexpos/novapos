'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Customer, Sale, ImportAnalysis, Payment, ProductReturn, ImportRow } from '@/lib/types';
import { db } from '@/lib/db';
import Papa from 'papaparse';
import { startOfDay } from 'date-fns';
import { safeNumber, roundFinancial } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

const triggerSync = () => {
    if (typeof window !== 'undefined') {
        const state = useAppStore.getState();
        if (state && state.actions) {
            state.actions.triggerSmartSync();
        }
    }
};

const ALLOWED_SORT_FIELDS: Record<string, keyof Customer> = {
    outstandingBalance: 'outstandingBalance',
    totalSpent:        'totalSpent',
    firstName:         'firstName',
    lastName:          'lastName',
    createdAt:         'createdAt',
    creditLimit:       'creditLimit',
    searchName:        'searchName',
};

class CustomerService {

    async getCustomers(): Promise<Customer[]> {
        return db.customers.filter(c => !c.deletedAt).toArray();
    }

    async getCustomerByUuid(uuid: string): Promise<Customer | undefined> {
        return db.customers.where('uuid').equals(uuid).filter(c => !c.deletedAt).first();
    }

    async filterCustomers(filters: {
        query?: string;
        status?: 'all' | 'has_debt' | 'overdue' | 'over_limit' | 'is_bread_client';
        sortBy?: string;
    }): Promise<Customer[]> {
        let collection = db.customers.filter(c => !c.deletedAt);

        if (filters.status) {
            if (filters.status === 'has_debt')
                collection = collection.filter(c => safeNumber(c.outstandingBalance) > 0.009);
            if (filters.status === 'overdue')
                collection = collection.filter(c => c.debtStatus === 'overdue');
            if (filters.status === 'over_limit')
                collection = collection.filter(c => c.isOverLimit === true);
            if (filters.status === 'is_bread_client')
                collection = collection.filter(c => !!c.isBreadClient);
        }

        let customers = await collection.toArray();

        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase().trim();
            customers = customers.filter(c => {
                const searchableName = (
                    c.searchName || `${c.firstName} ${c.lastName}`
                ).toLowerCase();
                return (
                    searchableName.includes(lowerQuery) ||
                    (c.phone || '').includes(lowerQuery)
                );
            });
        }

        if (filters.sortBy) {
            const lastUnderscore = filters.sortBy.lastIndexOf('_');
            const rawField = filters.sortBy.substring(0, lastUnderscore);
            const order = filters.sortBy.substring(lastUnderscore + 1);
            
            const field = (ALLOWED_SORT_FIELDS[rawField] ?? 'createdAt') as keyof Customer;
            const isAsc = order === 'asc';

            customers.sort((a, b) => {
                const valA = a[field] ?? 0;
                const valB = b[field] ?? 0;
                if (valA < valB) return isAsc ? -1 : 1;
                if (valA > valB) return isAsc ? 1 : -1;
                return 0;
            });
        } else {
            customers.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
        }

        return customers;
    }

    async addCustomer(customerData: Partial<Omit<Customer, 'uuid' | 'syncStatus' | 'version'>>): Promise<Customer> {
        if (!customerData.firstName || !customerData.lastName) {
            throw new Error('Prénom et nom requis.');
        }

        const now = new Date();
        const searchName = `${customerData.firstName} ${customerData.lastName}`.toLowerCase().trim();

        const initialBal = roundFinancial(safeNumber(customerData.initialBalance));

        const newCustomer: Customer = {
            uuid: uuidv4(),
            firstName: customerData.firstName.trim(),
            lastName: customerData.lastName.trim(),
            searchName,
            phone: customerData.phone?.trim(),
            address: customerData.address?.trim(),
            settlementDay: customerData.settlementDay,
            creditLimit: roundFinancial(safeNumber(customerData.creditLimit)),
            initialBalance: initialBal,
            totalSpent: 0,
            outstandingBalance: initialBal,
            isBreadClient: !!customerData.isBreadClient,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            version: 1
        };

        await db.transaction('rw', [db.customers, db.sync_queue], async () => {
            const id = await db.customers.add(newCustomer);
            newCustomer.id = id;
            await db.sync_queue.add({ table: 'customers', operation: 'CREATE', payload: newCustomer, timestamp: Date.now() });
        });

        triggerSync();
        return newCustomer;
    }

    async updateCustomer(uuid: string, customerData: Partial<Customer>): Promise<Customer> {
        const existing = await db.customers.where('uuid').equals(uuid).first();
        if (!existing?.id) throw new Error('Client non identifié.');

        const firstName = customerData.firstName || existing.firstName;
        const lastName  = customerData.lastName  || existing.lastName;
        const searchName = `${firstName} ${lastName}`.toLowerCase().trim();

        const update: Partial<Customer> = {
            ...customerData,
            searchName,
            updatedAt: new Date(),
            syncStatus: 'pending'
        };

        await db.transaction('rw', [db.customers, db.sync_queue], async () => {
            await db.customers.update(existing.id!, update);
            await db.sync_queue.add({
                table: 'customers',
                operation: 'UPDATE',
                payload: { ...existing, ...update },
                timestamp: Date.now()
            });
        });

        const updated = await this.recalculateCustomerStatus(uuid);
        triggerSync();
        return updated;
    }

    async deleteCustomer(uuid: string): Promise<void> {
        const customer = await db.customers.where('uuid').equals(uuid).first();
        if (!customer?.id) return;

        // TITANIUM RULE: Soft delete only. Check for active debt before allowing deletion.
        if (Math.abs(safeNumber(customer.outstandingBalance)) > 0.009) {
            throw new Error("Révocation impossible : le solde débiteur n'est pas nul.");
        }

        const update = { deletedAt: new Date(), updatedAt: new Date(), syncStatus: 'pending' as const };

        await db.transaction('rw', [db.customers, db.sync_queue], async () => {
            await db.customers.update(customer.id!, update);
            await db.sync_queue.add({
                table: 'customers',
                operation: 'DELETE',
                payload: { uuid },
                timestamp: Date.now()
            });
        });

        triggerSync();
    }

    async recalculateCustomerStatus(customerUuid: string): Promise<Customer> {
        const customer = await db.customers.where('uuid').equals(customerUuid).first();
        if (!customer?.id) throw new Error("Client introuvable lors de l'audit financier.");

        const now = new Date();
        const [sales, payments, returns] = await Promise.all([
            db.sales.where('customerUuid').equals(customerUuid).toArray(),
            db.payments.where('customerUuid').equals(customerUuid).toArray(),
            db.product_returns.where('customerUuid').equals(customerUuid).toArray(),
        ]);

        const activeSales = sales.filter(s => !s.isCancelled);

        let totalDebtCents = Math.round(safeNumber(customer.initialBalance) * 100);
        let totalSpentCents = 0;

        activeSales.forEach(s => {
            totalDebtCents  += Math.round(safeNumber(s.remainingBalance) * 100);
            totalSpentCents += Math.round(safeNumber(s.total) * 100);
        });
        payments.forEach(p => {
            totalDebtCents -= Math.round(safeNumber(p.amount) * 100);
        });
        returns.forEach(r => {
            const net = Math.round(safeNumber(r.totalReturnValue) * 100) - Math.round(safeNumber(r.amountRefunded) * 100);
            totalDebtCents  -= net;
            totalSpentCents -= Math.round(safeNumber(r.totalReturnValue) * 100);
        });

        const newBalance  = roundFinancial(totalDebtCents / 100);
        const totalSpent  = roundFinancial(Math.max(0, totalSpentCents / 100));
        const limit       = safeNumber(customer.creditLimit);
        const isOverLimit = limit > 0 ? newBalance > (limit + 0.009) : false;

        let debtStatus: Customer['debtStatus'] = 'none';
        if (newBalance > 0.009) {
            debtStatus = 'due_soon'; // Simplified logic for performance
        }

        const customerUpdate: Partial<Customer> = {
            totalSpent,
            outstandingBalance: newBalance,
            lastActivityDate: now,
            isOverLimit,
            debtStatus,
            updatedAt: now,
        };

        await db.customers.update(customer.id!, customerUpdate);
        return { ...customer, ...customerUpdate };
    }

    async getCustomerActivity(customerUuid: string, page: number = 1, limit: number = 10): Promise<Array<any>> {
        const [sales, payments, returns] = await Promise.all([
            db.sales.where('customerUuid').equals(customerUuid).toArray(),
            db.payments.where('customerUuid').equals(customerUuid).toArray(),
            db.product_returns.where('customerUuid').equals(customerUuid).toArray(),
        ]);

        const customer = await this.getCustomerByUuid(customerUuid);
        const activity: any[] = [
            ...sales.filter(s => !s.isCancelled).map(s => ({ ...s, type: 'sale', date: s.createdAt })),
            ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate })),
            ...returns.map(r => ({ ...r, type: 'return', date: r.createdAt })),
        ];

        if (customer && Math.abs(safeNumber(customer.initialBalance)) > 0.009) {
            activity.push({ uuid: 'init-' + customer.uuid, type: 'initial_balance', date: customer.createdAt, amount: customer.initialBalance, notes: "Report initial." });
        }

        activity.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
        return activity.slice((page - 1) * limit, page * limit);
    }
}

export const customerService = new CustomerService();
