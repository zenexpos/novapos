'use client';
import { v4 as uuidv4 } from 'uuid';
import type { StockIntake } from '@/lib/types';
import { db } from '@/lib/db';
import { inventoryService } from './inventory.service';
import { supplierService } from './supplier.service';
import { useAppStore } from '@/stores/appStore';

class StockService {
    
    async getStockIntakes(filters: { query?: string; from?: Date; to?: Date }): Promise<StockIntake[]> {
        let collection = db.stock_intakes.toCollection();

        if (filters.from) {
            collection = collection.filter(i => new Date(i.createdAt!) >= filters.from!);
        }
        if (filters.to) {
            collection = collection.filter(i => new Date(i.createdAt!) <= filters.to!);
        }

        let intakes = await collection.toArray();

        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase();
            const suppliers = await db.suppliers.filter(s => s.name.toLowerCase().includes(lowerQuery)).toArray();
            const supplierUuids = suppliers.map(s => s.uuid);
            intakes = intakes.filter(i => 
                (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(lowerQuery)) ||
                (i.supplierUuid && supplierUuids.includes(i.supplierUuid))
            );
        }

        return intakes.sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    
    async addStockIntake(intakeData: Omit<StockIntake, 'uuid' | 'createdAt' | 'updatedAt'>): Promise<StockIntake> {
        const now = new Date();
        const newIntake: StockIntake = {
            ...intakeData,
            uuid: uuidv4(),
            createdAt: now,
            updatedAt: now,
        };
        const id = await db.stock_intakes.add(newIntake);
        newIntake.id = id;

        // Trigger Cloud Sync
        useAppStore.getState().actions.triggerSmartSync();

        return newIntake;
    }

    async processStockIntakeCancellation(intakeUuid: string): Promise<void> {
        await db.transaction('rw', [db.stock_intakes, db.products, db.suppliers, db.inventory_logs], async () => {
            const intake = await db.stock_intakes.where('uuid').equals(intakeUuid).first();
            if (!intake || !intake.id) {
                throw new Error("Réception de stock non trouvée.");
            }

            for (const item of intake.items) {
                if (item.productUuid) {
                    const quantityToRevert = item.quantityReceived - item.quantityDamaged;
                    await inventoryService.adjustStock(item.productUuid, -quantityToRevert, 'cancellation', intake.uuid);
                }
            }

            if (intake.supplierUuid && intake.totalValue > 0) {
                await supplierService.updateSupplierBalance(intake.supplierUuid, -intake.totalValue);
            }

            await db.stock_intakes.delete(intake.id);
        });

        // Trigger Cloud Sync
        useAppStore.getState().actions.triggerSmartSync();
    }
}

export const stockService = new StockService();