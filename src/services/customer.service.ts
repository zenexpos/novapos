'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Customer, ImportAnalysis, CustomerFormData, CustomerUpdateInput, ProductReturn } from '@/lib/types';
import { db } from '@/lib/db';
import Papa from 'papaparse';
import { startOfMonth, subMonths, format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeNumber, roundFinancial } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { sanitizeString } from '@/lib/security/sanitization';

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
                const searchableName = (c.searchName || `${c.firstName} ${c.lastName}`).toLowerCase();
                return searchableName.includes(lowerQuery) || (c.phone || '').includes(lowerQuery);
            });
        }

        const sortBy = filters.sortBy || 'createdAt_desc';
        const [field, order] = sortBy.split('_');
        const isAsc = order === 'asc';

        customers.sort((a: any, b: any) => {
            const valA = a[field];
            const valB = b[field];
            if (typeof valA === 'string' && typeof valB === 'string') {
                return isAsc ? valA.localeCompare(valB, 'fr') : valB.localeCompare(valA, 'fr');
            }
            return isAsc ? safeNumber(valA) - safeNumber(valB) : safeNumber(valB) - safeNumber(valA);
        });

        return customers;
    }

    async addCustomer(customerData: CustomerFormData): Promise<Customer> {
        const now = new Date();
        const firstName = sanitizeString(customerData.firstName);
        const lastName = sanitizeString(customerData.lastName);
        const initialBal = roundFinancial(safeNumber(customerData.initialBalance));

        const newCustomer: Customer = {
            uuid: uuidv4(),
            firstName,
            lastName,
            searchName: `${firstName} ${lastName}`.toLowerCase(),
            phone: sanitizeString(customerData.phone) || undefined,
            address: sanitizeString(customerData.address) || undefined,
            settlementDay: customerData.settlementDay,
            creditLimit: roundFinancial(safeNumber(customerData.creditLimit)),
            initialBalance: initialBal,
            totalSpent: 0,
            outstandingBalance: initialBal,
            isBreadClient: !!customerData.isBreadClient,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            version: 1,
            debtStatus: initialBal > 0.01 ? 'due_soon' : 'none',
            isOverLimit: false,
            breadProfile: { recurrenceType: 'aucun', defaultQuantity: 0, weeklySchedule: {} }
        };

        await db.transaction('rw', [db.customers, db.sync_queue], async () => {
            await db.customers.add(newCustomer);
            await db.sync_queue.add({ table: 'customers', operation: 'CREATE', payload: newCustomer, timestamp: Date.now() });
        });

        this.triggerSync();
        return newCustomer;
    }

    async updateCustomer(uuid: string, updateData: CustomerUpdateInput): Promise<Customer> {
        const existing = await db.customers.where('uuid').equals(uuid).first();
        if (!existing?.id) throw new Error('Client non identifié.');

        const finalUpdate: Partial<Customer> = {
            ...updateData,
            updatedAt: new Date(),
            syncStatus: 'pending',
            version: (existing.version || 1) + 1
        };

        if (updateData.firstName || updateData.lastName) {
            const f = sanitizeString(updateData.firstName || existing.firstName);
            const l = sanitizeString(updateData.lastName || existing.lastName);
            finalUpdate.searchName = `${f} ${l}`.toLowerCase();
        }

        await db.transaction('rw', [db.customers, db.sync_queue], async () => {
            await db.customers.update(existing.id!, finalUpdate);
            await db.sync_queue.add({ table: 'customers', operation: 'UPDATE', payload: { ...existing, ...finalUpdate }, timestamp: Date.now() });
        });

        return this.recalculateCustomerStatus(uuid);
    }

    async deleteCustomer(uuid: string): Promise<void> {
        const customer = await db.customers.where('uuid').equals(uuid).first();
        if (!customer?.id) return;
        if (Math.abs(safeNumber(customer.outstandingBalance)) > 0.01) throw new Error(`Révocation impossible : solde non nul.`);

        await db.transaction('rw', [db.customers, db.sync_queue], async () => {
            await db.customers.update(customer.id!, { deletedAt: new Date(), updatedAt: new Date(), syncStatus: 'pending' });
            await db.sync_queue.add({ table: 'customers', operation: 'DELETE', payload: { uuid }, timestamp: Date.now() });
        });
        this.triggerSync();
    }

    async recalculateCustomerStatus(customerUuid: string): Promise<Customer> {
        return await db.transaction('rw', [db.customers, db.sales, db.payments, db.product_returns], async () => {
            const customer = await db.customers.where('uuid').equals(customerUuid).first();
            if (!customer?.id) throw new Error("Client introuvable.");

            const sales = await db.sales.where('customerUuid').equals(customerUuid).filter(s => !s.isCancelled).toArray();
            const payments = await db.payments.where('customerUuid').equals(customerUuid).toArray();
            const returns = await db.product_returns.where('customerUuid').equals(customerUuid).toArray();

            // Precision audit using cents-based arithmetic
            let debtCents = Math.round(safeNumber(customer.initialBalance) * 100);
            let spentCents = 0;

            sales.forEach(s => {
                debtCents += Math.round(safeNumber(s.remainingBalance) * 100);
                spentCents += Math.round(safeNumber(s.total) * 100);
            });
            payments.forEach(p => debtCents -= Math.round(safeNumber(p.amount) * 100));
            returns.forEach(r => {
                const netReturnCents = Math.round(safeNumber(r.totalReturnValue) * 100) - Math.round(safeNumber(r.amountRefunded) * 100);
                debtCents -= netReturnCents;
                spentCents -= Math.round(safeNumber(r.totalReturnValue) * 100);
            });

            const balance = roundFinancial(debtCents / 100);
            const spent = roundFinancial(Math.max(0, spentCents / 100));
            const limit = safeNumber(customer.creditLimit);
            
            const update = {
                totalSpent: spent,
                outstandingBalance: balance,
                isOverLimit: limit > 0 ? balance > (limit + 0.009) : false,
                debtStatus: (balance > 0.009 ? 'due_soon' : 'none') as any,
                updatedAt: new Date()
            };

            await db.customers.update(customer.id!, update);
            this.triggerSync();
            return { ...customer, ...update };
        });
    }

    private triggerSync() {
        if (typeof window !== 'undefined') {
            const state = useAppStore.getState();
            state?.actions?.triggerSmartSync?.();
        }
    }

    async getCustomerActivity(customerUuid: string, page: number = 1, limit: number = 10): Promise<any[]> {
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
        if (customer && Math.abs(safeNumber(customer.initialBalance)) > 0.01) {
            activity.push({ uuid: 'init-' + customer.uuid, type: 'initial_balance', date: customer.createdAt, amount: customer.initialBalance, notes: "Ouverture de dossier (Report)." });
        }
        return activity.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()).slice((page - 1) * limit, page * limit);
    }

    async getCustomerMonthlySpending(customerUuid: string): Promise<{ month: string, total: number }[]> {
        const sales = await db.sales.where('customerUuid').equals(customerUuid).filter(s => !s.isCancelled).toArray();
        return Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), i);
            const start = startOfDay(date);
            const monthTotal = sales.filter(s => {
                const d = new Date(s.createdAt!);
                return d >= start && d < startOfMonth(subMonths(start, -1));
            }).reduce((sum, s) => sum + Math.round(safeNumber(s.total) * 100), 0);
            return { month: format(date, 'MMM yy', { locale: fr }), total: monthTotal / 100 };
        }).reverse();
    }

    async getCustomerStatementData(customerUuid: string) {
        const [customer, sales] = await Promise.all([
            this.getCustomerByUuid(customerUuid),
            db.sales.where('customerUuid').equals(customerUuid).filter(s => !s.isCancelled && s.remainingBalance > 0.01).toArray()
        ]);
        if (!customer) throw new Error("Client non trouvé");
        return { customer, unpaidSales: sales.sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()) };
    }

    async analyzeImport(file: File): Promise<ImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, { header: true, skipEmptyLines: true, complete: async (results) => {
                const existing = await this.getCustomers();
                const analysis: ImportAnalysis = { customersToAdd: [], customersToUpdate: [], errorRows: [], totalRows: results.data.length };
                for (const row of results.data as any[]) {
                    const f = row.firstName || row.Prénom || row.Prenom;
                    const l = row.lastName || row.Nom;
                    if (!f || !l) { analysis.errorRows.push({ ...row, error: "Identité manquante" }); continue; }
                    const data = { firstName: String(f).trim(), lastName: String(l).trim(), phone: String(row.phone || row.Téléphone || '').trim(), address: String(row.address || row.Adresse || '').trim(), initialBalance: safeNumber(row.initialBalance || 0), creditLimit: safeNumber(row.creditLimit || 0), isBreadClient: false };
                    const match = existing.find(c => c.firstName.toLowerCase() === data.firstName.toLowerCase() && c.lastName.toLowerCase() === data.lastName.toLowerCase());
                    if (match) analysis.customersToUpdate.push({ ...data, uuid: match.uuid });
                    else analysis.customersToAdd.push(data);
                }
                resolve(analysis);
            }, error: (err) => reject(err) });
        });
    }

    async executeImport(confirmed: { toAdd: any[], toUpdate: any[] }) {
        await db.transaction('rw', [db.customers, db.sync_queue], async () => {
            for (const item of confirmed.toAdd) await this.addCustomer(item);
            for (const item of confirmed.toUpdate) { const { uuid, ...rest } = item; if (uuid) await this.updateCustomer(uuid, rest); }
        });
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        for (const uuid of uuids) await this.deleteCustomer(uuid);
    }
}

export const customerService = new CustomerService();
