'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Customer, ImportAnalysis, ImportRow, CustomerFormData, CustomerUpdateInput, Sale, Payment, ProductReturn, BreadProfile } from '@/lib/types';
import { db } from '@/lib/db';
import Papa from 'papaparse';
import { startOfMonth, subMonths, format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeNumber, roundFinancial } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { sanitizeString } from '@/lib/security/sanitization';

/**
 * iPOS Customer Domain Service.
 * Specialized in CRM management, debt tracking, and individual invoice auditing.
 */
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

        const sortBy = filters.sortBy || 'createdAt_desc';
        const [field, order] = sortBy.split('_');
        const isAsc = order === 'asc';

        customers.sort((a: any, b: any) => {
            const valA = a[field];
            const valB = b[field];

            if (typeof valA === 'string' && typeof valB === 'string') {
                return isAsc ? valA.localeCompare(valB, 'fr') : valB.localeCompare(valA, 'fr');
            }
            
            const numA = safeNumber(valA);
            const numB = safeNumber(valB);
            return isAsc ? numA - numB : numB - numA;
        });

        return customers;
    }

    async addCustomer(customerData: CustomerFormData): Promise<Customer> {
        if (!customerData.firstName || !customerData.lastName) {
            throw new Error('Prénom et nom requis.');
        }

        const now = new Date();
        const firstName = sanitizeString(customerData.firstName);
        const lastName = sanitizeString(customerData.lastName);
        const searchName = `${firstName} ${lastName}`.toLowerCase();
        const initialBal = roundFinancial(safeNumber(customerData.initialBalance));

        const newCustomer: Customer = {
            uuid: uuidv4(),
            firstName,
            lastName,
            searchName,
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
            breadProfile: {
                recurrenceType: 'aucun',
                defaultQuantity: 0,
                weeklySchedule: {},
            }
        };

        await db.transaction('rw', [db.customers, db.sync_queue], async () => {
            const id = await db.customers.add(newCustomer);
            newCustomer.id = id;
            await db.sync_queue.add({ table: 'customers', operation: 'CREATE', payload: newCustomer, timestamp: Date.now() });
        });

        this.triggerSync();
        return newCustomer;
    }

    async updateCustomer(uuid: string, updateData: CustomerUpdateInput): Promise<Customer> {
        const existing = await db.customers.where('uuid').equals(uuid).first();
        if (!existing?.id) throw new Error('Client non identifié.');

        const { breadProfile, ...rest } = updateData;

        const finalUpdate: Partial<Customer> = {
            ...rest,
            updatedAt: new Date(),
            syncStatus: 'pending',
            version: (existing.version || 1) + 1
        };

        if (breadProfile) {
            finalUpdate.breadProfile = {
                recurrenceType: breadProfile.recurrenceType ?? existing.breadProfile?.recurrenceType ?? 'aucun',
                defaultQuantity: breadProfile.defaultQuantity ?? existing.breadProfile?.defaultQuantity ?? 0,
                weeklySchedule: breadProfile.weeklySchedule ?? existing.breadProfile?.weeklySchedule ?? {},
                startDate: breadProfile.startDate ?? existing.breadProfile?.startDate,
            };
        }

        if (updateData.firstName !== undefined) finalUpdate.firstName = sanitizeString(updateData.firstName);
        if (updateData.lastName !== undefined) finalUpdate.lastName = sanitizeString(updateData.lastName);
        if (updateData.address !== undefined) finalUpdate.address = sanitizeString(updateData.address);

        if (finalUpdate.firstName || finalUpdate.lastName) {
            const f = finalUpdate.firstName ?? existing.firstName;
            const l = finalUpdate.lastName ?? existing.lastName;
            finalUpdate.searchName = `${f} ${l}`.toLowerCase();
        }

        await db.transaction('rw', [db.customers, db.sync_queue], async () => {
            await db.customers.update(existing.id!, finalUpdate);
            await db.sync_queue.add({
                table: 'customers',
                operation: 'UPDATE',
                payload: { ...existing, ...finalUpdate },
                timestamp: Date.now()
            });
        });

        const updated = await this.recalculateCustomerStatus(uuid);
        this.triggerSync();
        return updated;
    }

    async deleteCustomer(uuid: string): Promise<void> {
        const customer = await db.customers.where('uuid').equals(uuid).first();
        if (!customer?.id) return;

        if (Math.abs(safeNumber(customer.outstandingBalance)) > 0.009) {
            throw new Error(`Révocation impossible : le solde de "${customer.firstName} ${customer.lastName}" n'est pas nul (${customer.outstandingBalance} DA).`);
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

        this.triggerSync();
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        await db.transaction('rw', [db.customers, db.sync_queue], async () => {
            for (const uuid of uuids) {
                await this.deleteCustomer(uuid);
            }
        });
    }

    /**
     * Recalculates customer balance. Now uses independent invoice values.
     * Supports shared invoices by dividing the totals among owners.
     */
    async recalculateCustomerStatus(customerUuid: string): Promise<Customer> {
        return await db.transaction('rw', [db.customers, db.sales, db.payments, db.product_returns], async () => {
            const customer = await db.customers.where('uuid').equals(customerUuid).first();
            if (!customer?.id) throw new Error("Client introuvable lors de l'audit financier.");

            // Fetch sales explicitly assigned to this customer
            const sales = await db.sales.where('customerUuids').equals(customerUuid).toArray();
            const payments = await db.payments.where('customerUuid').equals(customerUuid).toArray();
            const returns = await db.product_returns.where('customerUuid').equals(customerUuid).toArray();

            const activeSales = sales.filter(s => !s.isCancelled);

            let totalDebtCents = Math.round(safeNumber(customer.initialBalance) * 100);
            let totalSpentCents = 0;

            activeSales.forEach(s => {
                // If it's a shared invoice, the debt is split among owners
                const ownerCount = s.customerUuids?.length || 1;
                totalDebtCents  += Math.round((safeNumber(s.remainingBalance) / ownerCount) * 100);
                totalSpentCents += Math.round((safeNumber(s.total) / ownerCount) * 100);
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

            const customerUpdate: Partial<Customer> = {
                totalSpent,
                outstandingBalance: newBalance,
                isOverLimit,
                debtStatus: newBalance > 0.009 ? 'due_soon' : 'none',
                updatedAt: new Date(),
            };

            await db.customers.update(customer.id!, customerUpdate);
            return { ...customer, ...customerUpdate };
        });
    }

    private triggerSync() {
        if (typeof window !== 'undefined') {
            const state = useAppStore.getState();
            if (state?.actions?.triggerSmartSync) {
                state.actions.triggerSmartSync();
            }
        }
    }

    async getCustomerActivity(customerUuid: string, page: number = 1, limit: number = 10): Promise<Array<any>> {
        const [sales, payments, returns] = await Promise.all([
            db.sales.where('customerUuids').equals(customerUuid).toArray(),
            db.payments.where('customerUuid').equals(customerUuid).toArray(),
            db.product_returns.where('customerUuid').equals(customerUuid).toArray(),
        ]);

        const customer = await this.getCustomerByUuid(customerUuid);
        const activity: any[] = [
            ...sales.filter(s => !s.isCancelled).map(s => {
                return { ...s, type: 'sale', date: s.createdAt };
            }),
            ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate })),
            ...returns.map(r => ({ ...r, type: 'return', date: r.createdAt })),
        ];

        if (customer && Math.abs(safeNumber(customer.initialBalance)) > 0.009) {
            activity.push({ uuid: 'init-' + customer.uuid, type: 'initial_balance', date: customer.createdAt, amount: customer.initialBalance, notes: "Situation de départ (Dette reportée)." });
        }

        activity.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
        return activity.slice((page - 1) * limit, page * limit);
    }

    async getCustomerMonthlySpending(customerUuid: string): Promise<{ month: string, total: number }[]> {
        const sales = await db.sales.where('customerUuids').equals(customerUuid).filter(s => !s.isCancelled).toArray();
        const last6Months = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), i);
            return {
                start: startOfDay(date),
                label: format(date, 'MMM yy', { locale: fr })
            };
        }).reverse();

        return last6Months.map(period => {
            const monthTotalCents = sales
                .filter(s => {
                    const d = new Date(s.createdAt!);
                    return d >= period.start && d < startOfMonth(subMonths(period.start, -1));
                })
                .reduce((sum, s) => {
                    return sum + Math.round(safeNumber(s.total) * 100);
                }, 0);
            
            return {
                month: period.label,
                total: monthTotalCents / 100
            };
        });
    }

    async getCustomerStatementData(customerUuid: string): Promise<{ customer: Customer, unpaidSales: Sale[] }> {
        const [customer, sales] = await Promise.all([
            this.getCustomerByUuid(customerUuid),
            db.sales.where('customerUuids').equals(customerUuid).filter(s => !s.isCancelled && s.remainingBalance > 0.009).toArray()
        ]);

        if (!customer) throw new Error("Client non trouvé");

        return {
            customer,
            unpaidSales: sales.sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
        };
    }

    async analyzeImport(file: File): Promise<ImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const existingCustomers = await this.getCustomers();
                    const analysis: ImportAnalysis = {
                        customersToAdd: [],
                        customersToUpdate: [],
                        errorRows: [],
                        totalRows: results.data.length
                    };

                    for (const row of results.data as ImportRow[]) {
                        const firstName = row.firstName || row.Prénom || row.Prenom;
                        const lastName = row.lastName || row.Nom;

                        if (!firstName || !lastName) {
                            analysis.errorRows.push({ ...row, error: "Identité incomplète" });
                            continue;
                        }

                        const data: Partial<Customer> = {
                            firstName: firstName.toString().trim(),
                            lastName: lastName.toString().trim(),
                            phone: (row.phone || row.Téléphone || row.Telephone || '').toString().trim(),
                            address: (row.address || row.Adresse || '').toString().trim(),
                            initialBalance: safeNumber(row.initialBalance || row.Solde_Initial || 0),
                            creditLimit: safeNumber(row.creditLimit || row.Limite_Crédit || 0),
                            isBreadClient: false
                        };

                        const existing = existingCustomers.find(c => 
                            c.firstName.toLowerCase() === data.firstName?.toLowerCase() && 
                            c.lastName.toLowerCase() === data.lastName?.toLowerCase()
                        );

                        if (existing) {
                            analysis.customersToUpdate.push({ ...data, uuid: existing.uuid });
                        } else {
                            analysis.customersToAdd.push(data);
                        }
                    }
                    resolve(analysis);
                },
                error: (err) => reject(err)
            });
        });
    }

    async executeImport(confirmedData: { toAdd: Partial<Customer>[], toUpdate: Partial<Customer>[] }): Promise<void> {
        await db.transaction('rw', [db.customers, db.sync_queue], async () => {
            for (const item of confirmedData.toAdd) {
                await this.addCustomer(item as CustomerFormData);
            }
            for (const item of confirmedData.toUpdate) {
                const { uuid, ...rest } = item;
                if (uuid) await this.updateCustomer(uuid, rest as CustomerUpdateInput);
            }
        });
    }
}

export const customerService = new CustomerService();
