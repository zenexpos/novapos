'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Supplier, SupplierPayment } from '@/lib/types';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/appStore';
import { safeNumber, roundFinancial } from '@/lib/utils';

const triggerSync = () => {
    if (typeof window !== 'undefined') {
        const state = useAppStore.getState();
        if (state && state.actions) {
            state.actions.triggerSmartSync();
        }
    }
};

/**
 * iPOS Zen - Supplier & Partnership Service.
 * Specialized in logistics balances and financial integrity.
 */
class SupplierService {

    async getSuppliers(): Promise<Supplier[]> {
        const suppliers = await db.suppliers.filter(s => !s.deletedAt).toArray();
        return suppliers.sort((a, b) => a.name.localeCompare(b.name));
    }

    async getSupplierByUuid(uuid: string): Promise<Supplier | undefined> {
        return db.suppliers.where('uuid').equals(uuid).filter(s => !s.deletedAt).first();
    }

    async findOrCreateSupplier(name: string, uuid?: string): Promise<Supplier> {
        if (uuid) {
            const existing = await this.getSupplierByUuid(uuid);
            if (existing) return existing;
        }

        const existingByName = await db.suppliers.where('name').equals(name).filter(s => !s.deletedAt).first();
        if (existingByName) return existingByName;

        const now = new Date();
        const newSupplier: Supplier = {
            uuid: uuidv4(),
            name: name.trim(),
            balance: 0,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            version: 1
        };

        await db.transaction('rw', [db.suppliers, db.sync_queue], async () => {
            const id = await db.suppliers.add(newSupplier);
            newSupplier.id = id;
            await db.sync_queue.add({ table: 'suppliers', operation: 'CREATE', payload: newSupplier, timestamp: Date.now() });
        });

        triggerSync();
        return newSupplier;
    }

    /**
     * Audit & Repair: Recalculates supplier balance from raw data (Intakes vs Payments).
     * ENSURES ABSOLUTE FINANCIAL ACCURACY across offline sessions.
     */
    async recalculateSupplierBalance(supplierUuid: string): Promise<void> {
        const supplier = await db.suppliers.where('uuid').equals(supplierUuid).first();
        if (!supplier?.id) return;

        const [intakes, payments] = await Promise.all([
            db.stock_intakes.where('supplierUuid').equals(supplierUuid).toArray(),
            db.supplier_payments.where('supplierUuid').equals(supplierUuid).toArray(),
        ]);

        // Precision arithmetic using cents to avoid floating point drift
        const totalPurchasesCents = intakes.reduce((sum, i) => sum + Math.round(safeNumber(i.totalValue) * 100), 0);
        const totalPaidCents = payments.reduce((sum, p) => sum + Math.round(safeNumber(p.amount) * 100), 0);

        const newBalance = roundFinancial((totalPurchasesCents - totalPaidCents) / 100);

        await db.suppliers.update(supplier.id, { 
            balance: newBalance, 
            updatedAt: new Date(), 
            syncStatus: 'pending' 
        });
    }

    /**
     * Helper for quick updates, but always triggers a full recalculation for safety.
     */
    async updateSupplierBalance(uuid: string, _amountChange: number): Promise<void> {
        await this.recalculateSupplierBalance(uuid);
    }

    async processSupplierPayment(paymentData: Omit<SupplierPayment, 'uuid' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>): Promise<void> {
        await db.transaction('rw', [db.suppliers, db.supplier_payments, db.sync_queue, db.stock_intakes], async () => {
            const supplier = await db.suppliers.where('uuid').equals(paymentData.supplierUuid).first();
            if (!supplier?.id) throw new Error("Fournisseur non trouvé.");

            const now = new Date();
            const newPayment: SupplierPayment = {
                ...paymentData,
                uuid: uuidv4(),
                createdAt: now,
                updatedAt: now,
                syncStatus: 'pending',
                version: 1
            };

            await db.supplier_payments.add(newPayment);
            
            // Recalculate using full audit path
            await this.recalculateSupplierBalance(paymentData.supplierUuid);

            await db.sync_queue.add({ table: 'supplier_payments', operation: 'CREATE', payload: newPayment, timestamp: Date.now() });
        });

        triggerSync();
    }

    async updateSupplier(uuid: string, data: Partial<Supplier>): Promise<void> {
        const supplier = await db.suppliers.where('uuid').equals(uuid).first();
        if (!supplier?.id) return;

        const update = { ...data, updatedAt: new Date(), syncStatus: 'pending' as const };
        await db.transaction('rw', [db.suppliers, db.sync_queue], async () => {
            await db.suppliers.update(supplier.id!, update);
            await db.sync_queue.add({ table: 'suppliers', operation: 'UPDATE', payload: { ...supplier, ...update }, timestamp: Date.now() });
        });
        triggerSync();
    }

    async deleteSupplier(uuid: string): Promise<void> {
        const supplier = await db.suppliers.where('uuid').equals(uuid).first();
        if (!supplier?.id) return;

        // Strict Financial Integrity: Only zero-balance suppliers can be deleted
        if (Math.abs(safeNumber(supplier.balance)) > 0.01) {
            throw new Error(`Révocation impossible : le رصيد de "${supplier.name}" n'est pas nul (${supplier.balance} DA).`);
        }

        // Secondary check: Are there any associated intakes?
        const intakeCount = await db.stock_intakes.where('supplierUuid').equals(uuid).count();
        if (intakeCount > 0) {
            throw new Error("Révocation impossible : Ce partenaire possède un historique de facturation actif.");
        }

        const update = { deletedAt: new Date(), updatedAt: new Date(), syncStatus: 'pending' as const };
        await db.transaction('rw', [db.suppliers, db.sync_queue], async () => {
            await db.suppliers.update(supplier.id!, update);
            await db.sync_queue.add({
                table: 'suppliers',
                operation: 'DELETE',
                payload: { uuid },
                timestamp: Date.now()
            });
        });
        
        triggerSync();
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        await db.transaction('rw', [db.suppliers, db.sync_queue, db.stock_intakes], async () => {
            for (const uuid of uuids) {
                await this.deleteSupplier(uuid);
            }
        });
    }

    async getSupplierActivity(supplierUuid: string): Promise<any[]> {
        const [intakes, payments] = await Promise.all([
            db.stock_intakes.where('supplierUuid').equals(supplierUuid).toArray(),
            db.supplier_payments.where('supplierUuid').equals(supplierUuid).toArray(),
        ]);

        const activity = [
            ...intakes.map(i => ({ ...i, type: 'intake', date: i.createdAt })),
            ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate })),
        ];

        return activity.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
    }
}

export const supplierService = new SupplierService();
