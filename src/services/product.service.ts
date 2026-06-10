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

        // Sorting logic based on sortBy string
        if (filters.sortBy) {
            const [field, order] = filters.sortBy.split('_');
            const isAsc = order === 'asc';
            products.sort((a, b) => {
                let valA: any = a[field as keyof Product] || 0;
                let valB: any = b[field as keyof Product] || 0;
                if (typeof valA === 'string') return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
                return isAsc ? valA - valB : valB - valA;
            });
        }

        return products;
    }

    async addProduct(productData: Omit<Product, 'uuid' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>): Promise<Product> {
        const now = new Date();
        const quantity = safeNumber(productData.quantity);
        const minStockLevel = safeNumber(productData.minStockLevel);

        const newProduct: Product = {
            ...productData,
            uuid: uuidv4(),
            quantity,
            minStockLevel,
            stockStatus: calculateStockStatus(quantity, minStockLevel),
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            version: 1
        };

        await db.transaction('rw', [db.products, db.sync_queue, db.inventory_logs], async () => {
            await db.products.add(newProduct);
            
            if (quantity !== 0) {
                await inventoryService.adjustStock(newProduct.uuid, quantity, 'manual_adjustment', 'INITIAL_STOCK');
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

    async updateProduct(uuid: string, data: Partial<Product>): Promise<void> {
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

    async updateProductFromIntake(uuid: string, data: { purchasePrice: number; price?: number; barcodes?: string[] }): Promise<void> {
        const existing = await db.products.where('uuid').equals(uuid).first();
        if (!existing?.id) return;

        const update: Partial<Product> = {
            purchasePrice: data.purchasePrice,
            updatedAt: new Date(),
            syncStatus: 'pending'
        };

        if (data.price !== undefined) update.price = data.price;
        if (data.barcodes) {
            const newBarcodes = Array.from(new Set([...(existing.barcodes || []), ...data.barcodes]));
            update.barcodes = newBarcodes;
        }

        await db.products.update(existing.id, update);
        // Sync queue will be handled by the parent transaction in appStore
    }

    async deleteProduct(uuid: string): Promise<void> {
        const existing = await db.products.where('uuid').equals(uuid).first();
        if (!existing?.id) return;

        // TITANIUM RULE: Soft delete only
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

    async duplicateProduct(uuid: string): Promise<Product> {
        const existing = await db.products.where('uuid').equals(uuid).first();
        if (!existing) throw new Error("Produit source introuvable.");

        const { id, uuid: oldUuid, createdAt, updatedAt, ...rest } = existing;
        return this.addProduct({
            ...rest,
            name: `${rest.name} (Copie)`,
            quantity: 0, // Ne pas dupliquer le stock physique
        });
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        for (const uuid of uuids) {
            await this.deleteProduct(uuid);
        }
    }

    async analyzeImport(file: File): Promise<ProductImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const existingProducts = await this.getProducts();
                    const existingMap = new Map(existingProducts.map(p => [p.name.toLowerCase(), p]));

                    const analysis: ProductImportAnalysis = {
                        productsToAdd: [],
                        productsToUpdate: [],
                        skippedRows: [],
                        errorRows: [],
                        totalRows: results.data.length
                    };

                    for (const row of results.data as any[]) {
                        const name = row.name || row.Désignation || row.Nom;
                        if (!name) {
                            analysis.errorRows.push({ ...row, error: "Nom manquant" });
                            continue;
                        }

                        const productData: Partial<Product> = {
                            name: name.trim(),
                            category: row.category || row.Catégorie || 'Général',
                            price: safeNumber(row.price || row.Prix_Vente),
                            purchasePrice: safeNumber(row.purchasePrice || row.Prix_Achat),
                            quantity: safeNumber(row.quantity || row.Stock),
                            minStockLevel: safeNumber(row.minStockLevel || row.Alerte || 10),
                            unite: row.unite || row.Unité || 'Pièce',
                        };

                        const existing = existingMap.get(name.trim().toLowerCase());
                        if (existing) {
                            analysis.productsToUpdate.push({ ...productData, uuid: existing.uuid });
                        } else {
                            analysis.productsToAdd.push(productData);
                        }
                    }
                    resolve(analysis);
                },
                error: (err) => reject(err)
            });
        });
    }

    async executeImport(confirmedData: { toAdd: any[], toUpdate: any[] }): Promise<void> {
        const now = new Date();
        
        await db.transaction('rw', [db.products, db.sync_queue, db.inventory_logs], async () => {
            // Processing additions
            for (const item of confirmedData.toAdd) {
                const uuid = uuidv4();
                const p: Product = {
                    ...item,
                    uuid,
                    createdAt: now,
                    updatedAt: now,
                    syncStatus: 'pending',
                    version: 1
                };
                await db.products.add(p);
                if (p.quantity !== 0) {
                    await inventoryService.adjustStock(uuid, p.quantity, 'manual_adjustment', 'IMPORT');
                }
                await db.sync_queue.add({ table: 'products', operation: 'CREATE', payload: p, timestamp: Date.now() });
            }

            // Processing updates
            for (const item of confirmedData.toUpdate) {
                const existing = await db.products.where('uuid').equals(item.uuid).first();
                if (existing) {
                    const update = { ...item, updatedAt: now, syncStatus: 'pending' };
                    await db.products.update(existing.id!, update);
                    await db.sync_queue.add({ table: 'products', operation: 'UPDATE', payload: { ...existing, ...update }, timestamp: Date.now() });
                }
            }
        });

        triggerSync();
    }
}

export const productService = new ProductService();
