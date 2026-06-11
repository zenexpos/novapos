'use client';

import { v4 as uuidv4 } from 'uuid';
import type { InventoryLog, InventoryLogReason, Product } from '@/lib/types';
import { db } from '@/lib/db';
import { calculateStockStatus, safeNumber, roundFinancial } from '@/lib/utils';

/**
 * Service de gestion d'inventaire avec traçabilité complète.
 * Chaque mouvement de stock génère un log d'audit immuable.
 */
class InventoryService {

    /**
     * Ajuste le stock d'un produit avec audit obligatoire.
     */
    async adjustStock(
        productUuid: string | null | undefined,
        quantityChange: number,
        reason: InventoryLogReason,
        relatedUuid?: string,
        details?: string
    ): Promise<void> {
        if (!productUuid || productUuid.startsWith('custom-')) return;

        const product = await db.products.where('uuid').equals(productUuid).first();
        if (!product?.id) {
            console.warn(`[Inventory] Produit introuvable: ${productUuid}`);
            return;
        }

        const currentQty = safeNumber(product.quantity);
        const change = roundFinancial(safeNumber(quantityChange));
        const newQty = Number((currentQty + change).toFixed(3));

        const updateData = {
            quantity: newQty,
            stockStatus: calculateStockStatus(newQty, product.minStockLevel),
            updatedAt: new Date(),
            syncStatus: 'pending' as const
        };

        const log: InventoryLog = {
            uuid: uuidv4(),
            productUuid,
            change,
            newQuantity: newQty,
            reason,
            relatedUuid,
            details: details || `Ajustement via ${reason}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: 'pending',
            version: 1
        };

        // Commitment atomique
        await db.transaction('rw', [db.products, db.inventory_logs, db.sync_queue], async () => {
            await db.products.update(product.id!, updateData);
            await db.inventory_logs.add(log);
            
            await db.sync_queue.add({
                table: 'products',
                operation: 'UPDATE',
                payload: { ...product, ...updateData },
                timestamp: Date.now()
            });
        });
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

        // Jointure manuelle performante pour le mode offline
        const productUuids = Array.from(new Set(logs.map(l => l.productUuid).filter(Boolean) as string[]));
        const products = await db.products.where('uuid').anyOf(productUuids).toArray();
        const productMap = new Map(products.map(p => [p.uuid, p.name]));

        let result = logs.map(log => ({
            ...log,
            productName: productMap.get(log.productUuid ?? '') ?? 'Produit archivé',
        }));

        if (filters.query) {
            const q = filters.query.toLowerCase();
            result = result.filter(l => 
                l.productName.toLowerCase().includes(q) || 
                l.reason.toLowerCase().includes(q)
            );
        }

        return result.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }

    async getStockSummary() {
        const products = await db.products.filter(p => !p.deletedAt).toArray();
        return {
            totalValue: products.reduce((s, p) => s + (safeNumber(p.quantity) * safeNumber(p.purchasePrice)), 0),
            outOfStock: products.filter(p => p.quantity <= 0).length,
            lowStock: products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length,
            totalProducts: products.length
        };
    }
}

export const inventoryService = new InventoryService();
