'use client';

import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { InventoryLog, InventoryLogReason } from '@/lib/types';

/**
 * iPOS Zen - Inventory Audit Service
 * Centralise la traçabilité des mouvements de stock.
 */
class InventoryAuditService {
    async logMovement(params: {
        productUuid: string;
        change: number;
        newQuantity: number;
        reason: InventoryLogReason;
        relatedUuid?: string;
        details?: string;
    }): Promise<void> {
        const log: InventoryLog = {
            uuid: uuidv4(),
            productUuid: params.productUuid,
            change: params.change,
            newQuantity: params.newQuantity,
            reason: params.reason,
            relatedUuid: params.relatedUuid,
            details: params.details,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: 'pending',
            version: 1
        };

        await db.inventory_logs.add(log);
    }

    async getProductHistory(productUuid: string): Promise<InventoryLog[]> {
        return db.inventory_logs
            .where('productUuid')
            .equals(productUuid)
            .reverse()
            .sortBy('createdAt');
    }
}

export const inventoryAuditService = new InventoryAuditService();
