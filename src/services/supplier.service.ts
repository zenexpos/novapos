'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Supplier, SupplierPayment } from '@/lib/types';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/appStore';

class SupplierService {

    async getSuppliers(): Promise<Supplier[]> {
        return db.suppliers.orderBy('name').toArray();
    }

    async getSupplierByUuid(uuid: string): Promise<Supplier | undefined> {
        return db.suppliers.where('uuid').equals(uuid).first();
    }

    async findOrCreateSupplier(name: string, uuid?: string): Promise<Supplier> {
        if (uuid) {
            const existing = await this.getSupplierByUuid(uuid);
            if (existing) return existing;
        }

        const existingByName = await db.suppliers.where('name').equals(name).first();
        if (existingByName) return existingByName;

        const now = new Date();
        const newSupplier: Supplier = {
            uuid: uuidv4(),
            name: name,
            balance: 0,
            createdAt: now,
            updatedAt: now,
        };
        const id = await db.suppliers.add(newSupplier);
        newSupplier.id = id;

        // Trigger Cloud Sync
        useAppStore.getState().actions.triggerSmartSync();

        return newSupplier;
    }

    async updateSupplierBalance(uuid: string, amountChange: number): Promise<void> {
        const supplier = await this.getSupplierByUuid(uuid);
        if (!supplier || !supplier.id) throw new Error("Fournisseur non trouvé.");
        
        const newBalance = supplier.balance + amountChange;
        await db.suppliers.update(supplier.id, { balance: newBalance, updatedAt: new Date() });

        // Trigger Cloud Sync (debounced)
        useAppStore.getState().actions.triggerSmartSync();
    }

    async processSupplierPayment(paymentData: Omit<SupplierPayment, 'uuid' | 'createdAt' | 'updatedAt'>): Promise<void> {
        await db.transaction('rw', [db.suppliers, db.supplier_payments], async () => {
            const supplier = await this.getSupplierByUuid(paymentData.supplierUuid);
            if (!supplier || !supplier.id) throw new Error("Fournisseur non trouvé.");

            const now = new Date();
            const newPayment: SupplierPayment = {
                ...paymentData,
                uuid: uuidv4(),
                createdAt: now,
                updatedAt: now,
            };

            await db.supplier_payments.add(newPayment);
            await db.suppliers.update(supplier.id, { 
                balance: supplier.balance - paymentData.amount,
                updatedAt: now
            });
        });

        // Trigger Cloud Sync
        useAppStore.getState().actions.triggerSmartSync();
    }

    async getSupplierActivity(supplierUuid: string): Promise<any[]> {
        const [intakes, payments] = await Promise.all([
            db.stock_intakes.where('supplierUuid').equals(supplierUuid).toArray(),
            db.supplier_payments.where('supplierUuid').equals(supplierUuid).toArray()
        ]);

        const activity = [
            ...intakes.map(i => ({ ...i, type: 'intake', date: i.createdAt })),
            ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate })),
        ];

        return activity.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
    }

    async updateSupplier(uuid: string, data: Partial<Supplier>): Promise<void> {
        const supplier = await this.getSupplierByUuid(uuid);
        if (supplier?.id) {
            await db.suppliers.update(supplier.id, { ...data, updatedAt: new Date() });
            // Trigger Cloud Sync
            useAppStore.getState().actions.triggerSmartSync();
        }
    }

    async deleteSupplier(uuid: string): Promise<void> {
        const supplier = await this.getSupplierByUuid(uuid);
        if (!supplier?.id) return;

        const intakesCount = await db.stock_intakes.where('supplierUuid').equals(uuid).count();
        if (intakesCount > 0) {
            throw new Error(`Impossible de supprimer "${supplier.name}" : ce fournisseur a des factures enregistrées.`);
        }

        if (supplier.balance !== 0) {
            throw new Error(`Impossible de supprimer "${supplier.name}" : le solde du fournisseur n'est pas nul.`);
        }

        await db.suppliers.delete(supplier.id);
        
        // Trigger Cloud Sync
        useAppStore.getState().actions.triggerSmartSync();
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        for (const uuid of uuids) {
            await this.deleteSupplier(uuid);
        }
    }
}

export const supplierService = new SupplierService();