'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Product, ProductCreateInput, ProductImportAnalysis } from '@/lib/types';
import { db } from '@/lib/db';
import { calculateStockStatus, safeNumber, roundFinancial } from '@/lib/utils';
import { inventoryService } from './inventory.service';
import Papa from 'papaparse';
import { useAppStore } from '@/stores/appStore';

const triggerSync = () => {
    if (typeof window !== 'undefined') {
        const state = useAppStore.getState();
        if (state && state.actions) {
            state.actions.triggerSmartSync();
        }
    }
};

class ProductService {

    /**
     * FACTORY PATTERN: Centralise la création d'une entité Produit valide.
     */
    createProductEntity(input: ProductCreateInput, customUuid?: string): Product {
        const now = new Date();
        const quantity = safeNumber(input.quantity);
        const minStockLevel = safeNumber(input.minStockLevel || 10);
        
        return {
            uuid: customUuid || uuidv4(),
            name: input.name.trim(),
            price: safeNumber(input.price),
            purchasePrice: safeNumber(input.purchasePrice),
            quantity,
            minStockLevel,
            barcodes: input.barcodes || [],
            unit: input.unit || 'Pièce',
            category: input.category || 'Général',
            dateExpiration: input.dateExpiration,
            supplierUuid: input.supplierUuid,
            stockStatus: calculateStockStatus(quantity, minStockLevel),
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            version: 1,
            flash: false
        };
    }

    async getProducts(): Promise<Product[]> {
        return db.products.filter(p => !p.deletedAt).toArray();
    }
    
    async getProductsByUuids(uuids: string[]): Promise<Product[]> {
        return db.products.where('uuid').anyOf(uuids).filter(p => !p.deletedAt).toArray();
    }

    async filterProducts(filters: {
        query?: string;
        supplierUuid?: string;
        stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';
        sortBy?: string;
        signal?: AbortSignal;
    }): Promise<Product[]> {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        let collection = db.products.filter(p => !p.deletedAt);

        if (filters.stockStatus === 'expired') {
            collection = collection.filter(p => !!p.dateExpiration && new Date(p.dateExpiration) < now);
        } else if (filters.stockStatus === 'expiring_soon') {
            collection = collection.filter(p => !!p.dateExpiration && new Date(p.dateExpiration) >= now && new Date(p.dateExpiration) <= thirtyDaysFromNow);
        } else if (filters.stockStatus && ['in_stock', 'low_stock', 'out_of_stock'].includes(filters.stockStatus)) {
            collection = collection.filter(p => p.stockStatus === filters.stockStatus);
        }

        if (filters.supplierUuid && filters.supplierUuid !== 'all') {
            collection = collection.filter(p => p.supplierUuid === filters.supplierUuid);
        }

        let products = await collection.toArray();

        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase().trim();
            products = products.filter(p => 
                p.name.toLowerCase().includes(lowerQuery) ||
                (p.barcodes && p.barcodes.some(b => b.includes(lowerQuery)))
            );
        }

        if (filters.sortBy) {
            const [field, order] = filters.sortBy.split('_');
            const isAsc = order === 'asc';
            products.sort((a, b) => {
                let valA: any = a[field as keyof Product] || 0;
                let valB: any = b[field as keyof Product] || 0;
                if (typeof valA === 'string') return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
                return isAsc ? valA - valB : valB - valA;
            });
        } else {
             products.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        }

        return products;
    }

    async addProduct(input: ProductCreateInput): Promise<Product> {
        const newProduct = this.createProductEntity(input);

        await db.transaction('rw', [db.products, db.sync_queue, db.inventory_logs], async () => {
            await db.products.add(newProduct);
            
            if (newProduct.quantity !== 0) {
                await inventoryService.adjustStock(newProduct.uuid, newProduct.quantity, 'manual_adjustment', 'INITIAL_STOCK');
            }

            await db.sync_queue.add({
                table: 'products',
                operation: 'CREATE',
                payload: newProduct,
                timestamp: Date.now()
            });
        });

        triggerSync();
        return newProduct;
    }

    async updateProduct(uuid: string, data: Partial<ProductCreateInput>): Promise<void> {
        const existing = await db.products.where('uuid').equals(uuid).first();
        if (!existing?.id) throw new Error("Produit non trouvé");

        const update = { ...data, updatedAt: new Date(), syncStatus: 'pending' as const };
        
        if (data.quantity !== undefined || data.minStockLevel !== undefined) {
            const finalQty = data.quantity !== undefined ? safeNumber(data.quantity) : existing.quantity;
            const finalMin = data.minStockLevel !== undefined ? safeNumber(data.minStockLevel) : existing.minStockLevel;
            update.stockStatus = calculateStockStatus(finalQty, finalMin);
        }

        await db.transaction('rw', [db.products, db.sync_queue], async () => {
            await db.products.update(existing.id!, update);
            await db.sync_queue.add({
                table: 'products',
                operation: 'UPDATE',
                payload: { ...existing, ...update },
                timestamp: Date.now()
            });
        });

        triggerSync();
    }

    async updateProductFromIntake(uuid: string, data: { purchasePrice: number, price?: number, barcodes?: string[] }): Promise<void> {
        const existing = await db.products.where('uuid').equals(uuid).first();
        if (!existing?.id) return;

        const update: any = {
            purchasePrice: data.purchasePrice,
            updatedAt: new Date(),
            syncStatus: 'pending'
        };

        if (data.price !== undefined) {
            update.price = data.price;
            update.priceUpdatedAt = new Date();
        }

        if (data.barcodes) {
            const merged = Array.from(new Set([...(existing.barcodes || []), ...data.barcodes]));
            update.barcodes = merged;
        }

        await db.products.update(existing.id, update);
        triggerSync();
    }

    async deleteProduct(uuid: string): Promise<void> {
        const existing = await db.products.where('uuid').equals(uuid).first();
        if (!existing?.id) return;

        const update = { 
            deletedAt: new Date(), 
            updatedAt: new Date(), 
            syncStatus: 'pending' as const 
        };
        
        await db.transaction('rw', [db.products, db.sync_queue], async () => {
            await db.products.update(existing.id!, update);
            await db.sync_queue.add({
                table: 'products',
                operation: 'DELETE',
                payload: { uuid },
                timestamp: Date.now()
            });
        });

        triggerSync();
    }
}

export const productService = new ProductService();
