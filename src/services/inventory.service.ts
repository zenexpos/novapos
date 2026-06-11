'use client';

import { v4 as uuidv4 } from 'uuid';
import type { InventoryLog, InventoryLogReason, Product } from '@/lib/types';
import { db } from '@/lib/db';
import { calculateStockStatus, safeNumber, roundFinancial } from '@/lib/utils';

/**
 * Service de gestion d'inventaire avec traçabilité complète.
 * Conçu pour fonctionner à l'intérieur de transactions Dexie pour une intégrité Enterprise.
 */
class InventoryService {

    /**
     * Ajuste le stock d'un produit avec audit obligatoire.
     * Cette méthode doit idéalement être appelée dans une transaction parente.
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
            console.warn(`[Inventory] Tentative d'ajustement pour un produit introuvable: ${productUuid}`);
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
            details: details || `Mouvement automatique via ${reason}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: 'pending',
            version: 1
        };

        // Note: Dexie inclut automatiquement ces appels dans la transaction parente si elle existe.
        await db.products.update(product.id, updateData);
        await db.inventory_logs.add(log);
        
        // Enregistrement dans la file de synchro
        await db.sync_queue.add({
            table: 'products',
            operation: 'UPDATE',
            payload: { ...product, ...updateData },
            timestamp: Date.now()
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

        // Jointure manuelle optimisée avec cache temporaire
        const productUuids = Array.from(new Set(logs.map(l => l.productUuid).filter(Boolean) as string[]));
        const products = await db.products.where('uuid').anyOf(productUuids).toArray();
        const productMap = new Map(products.map(p => [p.uuid, p.name]));

        let result = logs.map(log => ({
            ...log,
            productName: productMap.get(log.productUuid ?? '') ?? 'Produit archivé',
        }));

        if (filters.from && filters.to) {
            result = result.filter(l => {
                const d = new Date(l.createdAt!);
                return d >= filters.from! && d <= filters.to!;
            });
        }

        if (filters.query) {
            const q = filters.query.toLowerCase();
            result = result.filter(l => 
                l.productName.toLowerCase().includes(q) || 
                l.reason.toLowerCase().includes(q) ||
                (l.details && l.details.toLowerCase().includes(q))
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
