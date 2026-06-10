'use client';

import { v4 as uuidv4 } from 'uuid';
import type { InventoryLog, InventoryLogReason } from '@/lib/types';
import { db } from '@/lib/db';
import { calculateStockStatus, safeNumber, roundFinancial } from '@/lib/utils';

/**
 * InventoryService — moteur de traçabilité de stock.
 * RÈGLE : aucun mouvement de stock sans log dans inventory_logs.
 * Toutes les opérations se font en transaction Dexie.
 */
class InventoryService {

    /**
     * Ajuste le stock d'un produit (relatif : +qty ou -qty).
     * Ignoré pour les articles custom ou le produit pain virtuel.
     */
    async adjustStock(
        productUuid: string | null | undefined,
        quantityChange: number,
        reason: InventoryLogReason,
        relatedUuid?: string,
    ): Promise<void> {
        if (!productUuid
            || productUuid === 'BREAD_PRODUCT'
            || productUuid.startsWith('custom-')) return;

        await db.transaction('rw', [db.products, db.inventory_logs], async () => {
            const product = await db.products.where('uuid').equals(productUuid).first();
            if (!product?.id) return;

            const currentQty = safeNumber(product.quantity);
            const change     = roundFinancial(safeNumber(quantityChange));
            const newQty     = Number((currentQty + change).toFixed(3));

            await db.products.update(product.id, {
                quantity:    newQty,
                stockStatus: calculateStockStatus(newQty, product.minStockLevel),
                updatedAt:   new Date(),
            });

            const log: InventoryLog = {
                uuid:        uuidv4(),
                productUuid,
                change,
                newQuantity: newQty,
                reason,
                relatedUuid,
                createdAt:   new Date(),
                updatedAt:   new Date(),
                syncStatus:  'pending',
                version:     1
            };
            await db.inventory_logs.add(log);
        });
    }

    /**
     * Récupère les logs avec jointure produit.
     */
    async getLogs(filters: {
        query?: string;
        from?: Date;
        to?: Date;
        productUuid?: string;
    }): Promise<(InventoryLog & { productName: string })[]> {
        let logs: InventoryLog[];

        if (filters.productUuid) {
            logs = await db.inventory_logs
                .where('productUuid').equals(filters.productUuid)
                .toArray();
        } else if (filters.from && filters.to) {
            logs = await db.inventory_logs
                .where('createdAt').between(filters.from, filters.to, true, true)
                .toArray();
        } else {
            logs = await db.inventory_logs.toArray();
        }

        // Filtre additionnel date si productUuid fourni
        if (filters.productUuid && filters.from) {
            logs = logs.filter(l => new Date(l.createdAt!) >= filters.from!);
        }
        if (filters.productUuid && filters.to) {
            logs = logs.filter(l => new Date(l.createdAt!) <= filters.to!);
        }

        // Jointure produit
        const productMap = new Map<string, string>();
        const allProducts = await db.products.toArray();
        allProducts.forEach(p => productMap.set(p.uuid, p.name));

        let result = logs.map(log => ({
            ...log,
            productName: productMap.get(log.productUuid ?? '') ?? 'Produit supprimé',
        }));

        // Filtre texte
        if (filters.query) {
            const q = filters.query.toLowerCase();
            result = result.filter(l =>
                l.productName.toLowerCase().includes(q) ||
                l.reason.toLowerCase().includes(q),
            );
        }

        return result.sort(
            (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
        );
    }

    /** Vérifie si un produit a des logs d'inventaire sauvegardés. */
    async hasLogs(productUuid: string): Promise<boolean> {
        const count = await db.inventory_logs.where('productUuid').equals(productUuid).count();
        return count > 0;
    }

    /** Statistiques stock pour le dashboard : valeur, ruptures, alertes. */
    async getStockSummary(): Promise<{
        totalValue: number;
        outOfStock: number;
        lowStock: number;
        totalProducts: number;
    }> {
        const products = await db.products.toArray();
        let totalValue = 0;
        let outOfStock = 0;
        let lowStock   = 0;

        for (const p of products) {
            const qty = safeNumber(p.quantity);
            const pmp = safeNumber(p.purchasePrice);
            totalValue += qty * pmp;
            if (p.stockStatus === 'out_of_stock') outOfStock++;
            else if (p.stockStatus === 'low_stock') lowStock++;
        }

        return {
            totalValue: roundFinancial(totalValue),
            outOfStock,
            lowStock,
            totalProducts: products.length,
        };
    }
}

export const inventoryService = new InventoryService();