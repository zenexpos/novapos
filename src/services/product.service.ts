'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Product, ProductImportAnalysis, InventoryLog } from '@/lib/types';
import { db } from '@/lib/db';
import { calculateStockStatus, safeNumber, roundFinancial } from '@/lib/utils';
import { inventoryService } from './inventory.service';
import Papa from 'papaparse';
import { supplierService } from './supplier.service';
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

    async getProducts(options?: { sortBy?: string }): Promise<Product[]> {
        return db.products.filter(p => !p.deletedAt).toArray();
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

        let products: Product[] = [];

        if (filters.stockStatus === 'expired') {
            products = await db.products.where('dateExpiration').below(now).filter(p => !p.deletedAt).toArray();
        } else if (filters.stockStatus === 'expiring_soon') {
            products = await db.products.where('dateExpiration').between(now, thirtyDaysFromNow, true, true).filter(p => !p.deletedAt).toArray();
        } else if (filters.stockStatus && ['in_stock', 'low_stock', 'out_of_stock'].includes(filters.stockStatus)) {
            products = await db.products.where('stockStatus').equals(filters.stockStatus).filter(p => !p.deletedAt).toArray();
        } else {
            products = await db.products.filter(p => !p.deletedAt).toArray();
        }

        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase().trim();
            products = products.filter(p => 
                p.name.toLowerCase().includes(lowerQuery) ||
                (p.barcodes && p.barcodes.some(b => b.includes(lowerQuery)))
            );
        }

        return products;
    }

    async addProduct(productData: Omit<Product, 'uuid'>): Promise<Product> {
        const now = new Date();
        const newProduct: Product = {
            ...productData,
            uuid: uuidv4(),
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            version: 1
        };

        await db.transaction('rw', [db.products, db.sync_queue], async () => {
            await db.products.add(newProduct);
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

    async updateProduct(uuid: string, data: Partial<Product>): Promise<void> {
        const existing = await db.products.where('uuid').equals(uuid).first();
        if (!existing?.id) throw new Error("Produit non trouvé");

        const update = { ...data, updatedAt: new Date(), syncStatus: 'pending' as const };
        
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

    async deleteProduct(uuid: string): Promise<void> {
        const existing = await db.products.where('uuid').equals(uuid).first();
        if (!existing?.id) return;

        const update = { deletedAt: new Date(), updatedAt: new Date(), syncStatus: 'pending' as const };
        
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
