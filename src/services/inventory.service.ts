'use client';

import { v4 as uuidv4 } from 'uuid';
import type { InventoryLog, InventoryLogReason, Product } from '@/lib/types';
import { db } from '@/lib/db';
import { calculateStockStatus, safeNumber, roundFinancial } from '@/lib/utils';

/**
 * Service de gestion d'inventaire avec traçabilité complète.
 */
class InventoryService {

    /**
     * Ajuste le stock d'un produit.
     * Cette méthode est transactionnelle et génère un log d'audit.
     */
    async adjustStock(
        productUuid: string | null | undefined,
        quantityChange: number,
        reason: InventoryLogReason,
        relatedUuid?: string,
    ): Promise<void> {
        if (!productUuid || productUuid.startsWith('custom-')) return;

        const product = await db.products.where('uuid').equals(productUuid).first();
        if (!product?.id) return;

        const currentQty = safeNumber(product.quantity);
        const change = roundFinancial(safeNumber(quantityChange));
        const newQty = Number((currentQty + change).toFixed(3));

        const updateData = {
            quantity: newQty,
            stockStatus: calculateStockStatus(newQty, product.minStockLevel),
            updatedAt: new Date(),
        };

        const log: InventoryLog = {
            uuid: uuidv4(),
            productUuid,
            change,
            newQuantity: newQty,
            reason,
            relatedUuid,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: 'pending',
            version: 1
        };

        // Dexie will automatically include this in parent transaction if one exists
        await db.products.update(product.id, updateData);
        await db.inventory_logs.add(log);
    }

    async getLogs(filters: {
        query?: string;
        from?: Date;
        to?: Date;
        productUuid?: string;
    }): Promise<(InventoryLog & { productName: string })[]> {
        let logsCollection = db.inventory_logs.toCollection();

        if (filters.productUuid) {
            logsCollection = db.inventory_logs.where('productUuid').equals(filters.productUuid);
        }

        let logs = await logsCollection.toArray();

        // Join product names
        const productUuids = Array.from(new Set(logs.map(l => l.productUuid).filter(Boolean) as string[]));
        const products = await db.products.where('uuid').anyOf(productUuids).toArray();
        const productMap = new Map(products.map(p => [p.uuid, p.name]));

        let result = logs.map(log => ({
            ...log,
            productName: productMap.get(log.productUuid ?? '') ?? 'Produit supprimé',
        }));

        if (filters.from && filters.to) {
            result = result.filter(l => {
                const d = new Date(l.createdAt!);
                return d >= filters.from! && d <= filters.to!;
            });
        }

        if (filters.query) {
            const q = filters.query.toLowerCase();
            result = result.filter(l => l.productName.toLowerCase().includes(q) || l.reason.toLowerCase().includes(q));
        }

        return result.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }

    async getStockSummary() {
        const products = await db.products.toArray();
        return {
            totalValue: products.reduce((s, p) => s + (safeNumber(p.quantity) * safeNumber(p.purchasePrice)), 0),
            outOfStock: products.filter(p => p.quantity <= 0).length,
            lowStock: products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length,
            totalProducts: products.length
        };
    }
}

export const inventoryService = new InventoryService();
