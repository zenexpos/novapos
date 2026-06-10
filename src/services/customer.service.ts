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

// Map of authorized sort fields to prevent underscore splitting issues
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
        return db.customers.toArray();
    }

    async getCustomerByUuid(uuid: string): Promise<Customer | undefined> {
        return db.customers.where('uuid').equals(uuid).first();
    }

    async filterCustomers(filters: {
        query?: string;
        status?: 'all' | 'has_debt' | 'overdue' | 'over_limit' | 'is_bread_client';
        sortBy?: string;
    }): Promise<Customer[]> {
        let collection = db.customers.toCollection();

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

    async addCustomer(customerData: Partial<Omit<Customer, 'uuid'>>): Promise<Customer> {
        if (!customerData.firstName || !customerData.lastName) {
            throw new Error('Prénom et nom requis.');
        }

        const now = new Date();
        const searchName =
            `${customerData.firstName} ${customerData.lastName}`.toLowerCase().trim();

        const existing = await db.customers.where('searchName').equals(searchName).first();
        if (existing) {
            throw new Error('Un client avec ce nom exact existe déjà.');
        }

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
            isBreadClient: false,
            createdAt: now,
            updatedAt: now,
        };

        const id = await db.customers.add(newCustomer);
        newCustomer.id = id;

        triggerSync();
        return newCustomer;
    }

    async updateCustomer(uuid: string, customerData: Partial<Customer>): Promise<Customer> {
        const existing = await this.getCustomerByUuid(uuid);
        if (!existing?.id) throw new Error('Client non identifié.');

        const firstName = customerData.firstName || existing.firstName;
        const lastName  = customerData.lastName  || existing.lastName;
        const searchName = `${firstName} ${lastName}`.toLowerCase().trim();

        const dataToUpdate: Partial<Customer> = {
            ...customerData,
            searchName,
            updatedAt: new Date(),
        };

        if (customerData.initialBalance !== undefined) {
            dataToUpdate.initialBalance = roundFinancial(safeNumber(customerData.initialBalance));
        }
        if (customerData.creditLimit !== undefined) {
            dataToUpdate.creditLimit = roundFinancial(safeNumber(customerData.creditLimit));
        }

        await db.customers.update(existing.id, dataToUpdate);
        const updated = await this.recalculateCustomerStatus(uuid);

        triggerSync();
        return updated;
    }

    async deleteCustomer(uuid: string): Promise<void> {
        const customer = await this.getCustomerByUuid(uuid);
        if (!customer) return;

        const [salesCount, returnsCount, paymentsCount, breadOrdersCount] =
            await Promise.all([
                db.sales.where('customerUuid').equals(uuid).count(),
                db.product_returns.where('customerUuid').equals(uuid).count(),
                db.payments.where('customerUuid').equals(uuid).count(),
                db.bread_orders.where('customerUuid').equals(uuid).count(),
            ]);

        if (salesCount > 0 || returnsCount > 0 || paymentsCount > 0 || breadOrdersCount > 0) {
            throw new Error(
                "Révocation impossible : ce dossier possède un historique transactionnel actif.",
            );
        }

        if (Math.abs(safeNumber(customer.outstandingBalance)) > 0.009) {
            throw new Error("Révocation impossible : le solde débiteur n'est pas nul.");
        }

        if (customer.id) {
            await db.customers.delete(customer.id);
            triggerSync();
        }
    }

    async recalculateCustomerStatus(customerUuid: string): Promise<Customer> {
        const customer = await this.getCustomerByUuid(customerUuid);
        if (!customer?.id)
            throw new Error("Client introuvable lors de l'audit financier.");

        const now = new Date();
        const currentDayOfMonth = now.getDate();

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
            const net = Math.round(safeNumber(r.totalReturnValue) * 100)
                      - Math.round(safeNumber(r.amountRefunded) * 100);
            totalDebtCents  -= net;
            totalSpentCents -= Math.round(safeNumber(r.totalReturnValue) * 100);
        });

        const newBalance  = roundFinancial(totalDebtCents / 100);
        const totalSpent  = roundFinancial(Math.max(0, totalSpentCents / 100));
        const limit       = safeNumber(customer.creditLimit);
        const isOverLimit = limit > 0 ? newBalance > (limit + 0.009) : false;

        const hasPaymentThisMonth = payments.some(
            p => new Date(p.paymentDate) >= startOfDay(now),
        );

        let debtStatus: Customer['debtStatus'] = 'none';
        if (newBalance > 0.009) {
            const hasLateInvoices = activeSales.some(
                s => s.paymentStatus !== 'paid' && s.dueDate && new Date(s.dueDate) < now
            );
            if (
                hasLateInvoices ||
                (customer.settlementDay && currentDayOfMonth > customer.settlementDay && !hasPaymentThisMonth)
            ) {
                debtStatus = 'overdue';
            } else {
                debtStatus = 'due_soon';
            }
        }

        const customerUpdate: Partial<Customer> = {
            totalSpent,
            outstandingBalance: newBalance,
            lastActivityDate: now,
            isOverLimit,
            debtStatus,
            updatedAt: now,
        };

        await db.customers.update(customer.id, customerUpdate);
        triggerSync();
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
            activity.push({
                uuid: 'initial-balance-' + customer.uuid,
                type: 'initial_balance',
                date: customer.createdAt || new Date(0),
                amount: customer.initialBalance,
                notes: "Report de solde initial.",
            });
        }

        activity.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

        const start = (page - 1) * limit;
        return activity.slice(start, start + limit);
    }

    async getCustomerMonthlySpending(customerUuid: string): Promise<{ month: string; total: number }[]> {
        const sales   = await db.sales.where('customerUuid').equals(customerUuid).toArray();
        const returns = await db.product_returns.where('customerUuid').equals(customerUuid).toArray();

        const last6Months: { month: string; totalCents: number; timestamp: number }[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last6Months.push({
                month: d.toLocaleString('fr-FR', { month: 'short' }),
                totalCents: 0,
                timestamp: d.getTime(),
            });
        }

        sales.filter(s => !s.isCancelled).forEach(s => {
            const saleDate = new Date(s.createdAt!);
            const key = new Date(saleDate.getFullYear(), saleDate.getMonth(), 1).getTime();
            const idx = last6Months.findIndex(m => m.timestamp === key);
            if (idx !== -1) last6Months[idx].totalCents += Math.round(safeNumber(s.total) * 100);
        });

        returns.forEach(r => {
            const retDate = new Date(r.createdAt!);
            const key = new Date(retDate.getFullYear(), retDate.getMonth(), 1).getTime();
            const idx = last6Months.findIndex(m => m.timestamp === key);
            if (idx !== -1) last6Months[idx].totalCents -= Math.round(safeNumber(r.totalReturnValue) * 100);
        });

        return last6Months.map(m => ({ month: m.month, total: Math.max(0, m.totalCents / 100) }));
    }

    async getCustomerStatementData(customerUuid: string): Promise<{ customer: Customer; unpaidSales: Sale[] }> {
        const customer = await this.getCustomerByUuid(customerUuid);
        if (!customer) throw new Error('Client non trouvé');

        const unpaidSales = await db.sales
            .where('customerUuid')
            .equals(customerUuid)
            .filter(s => s.paymentStatus !== 'paid' && !s.isCancelled)
            .toArray();

        return {
            customer,
            unpaidSales: unpaidSales.sort(
                (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
            ),
        };
    }

    async analyzeImport(file: File): Promise<ImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async results => {
                    try {
                        const existingCustomers = await this.getCustomers();
                        const existingMap = new Map(
                            existingCustomers.map(c => [c.searchName, c]),
                        );

                        const analysis: ImportAnalysis = {
                            customersToAdd:    [],
                            customersToUpdate: [],
                            skippedRows:       [],
                            errorRows:         [],
                            totalRows:         results.data.length,
                        };

                        for (const row of results.data as any[]) {
                            const firstName = (row.firstName || row.prenom || row.Prénom || '').trim();
                            const lastName  = (row.lastName  || row.nom   || row.Nom   || '').trim();

                            if (!firstName || !lastName) {
                                analysis.errorRows.push({ rowNumber: 0, data: row, errors: ['Identité incomplète'] } as ImportRow);
                                continue;
                            }

                            const searchName = `${firstName} ${lastName}`.toLowerCase().trim();
                            const existingCustomer = existingMap.get(searchName);

                            const customerData: Partial<Customer> = {
                                firstName,
                                lastName,
                                phone:          (row.phone || row.telephone || row.Téléphone || '').trim(),
                                address:        (row.address || row.adresse || row.Adresse || '').trim(),
                                creditLimit:    safeNumber(row.creditLimit || row.limite || row.Limite_Crédit),
                                settlementDay:  parseInt(row.settlementDay || row.echeance || '0', 10),
                                initialBalance: safeNumber(row.initialBalance || row.Solde_Impayé || '0'),
                            };

                            if (existingCustomer) {
                                analysis.customersToUpdate.push({ ...customerData, uuid: existingCustomer.uuid, id: existingCustomer.id });
                            } else {
                                analysis.customersToAdd.push(customerData);
                            }
                        }
                        resolve(analysis);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: error => {
                    reject(new Error('Erreur parsing CSV : ' + error.message));
                },
            });
        });
    }

    async executeImport(confirmedData: { toAdd: Partial<Customer>[]; toUpdate: Partial<Customer>[] }): Promise<void> {
        const now = new Date();

        const toAdd = confirmedData.toAdd.map(c => {
            const initialBal = roundFinancial(safeNumber(c.initialBalance));
            return {
                ...c,
                uuid: uuidv4(),
                searchName: `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
                totalSpent: 0,
                initialBalance: initialBal,
                outstandingBalance: initialBal,
                isBreadClient: false,
                createdAt: now,
                updatedAt: now,
            } as Customer;
        });

        const toUpdate = confirmedData.toUpdate.map(c => ({
            ...c,
            initialBalance: roundFinancial(safeNumber(c.initialBalance)),
            searchName: `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
            updatedAt: now,
        }) as Customer);

        await db.transaction('rw', [db.customers], async () => {
            if (toAdd.length > 0)    await db.customers.bulkAdd(toAdd);
            if (toUpdate.length > 0) await db.customers.bulkPut(toUpdate);
        });

        for (const c of toUpdate) await this.recalculateCustomerStatus(c.uuid);
        for (const c of toAdd)    await this.recalculateCustomerStatus(c.uuid);

        triggerSync();
    }
}

export const customerService = new CustomerService();
