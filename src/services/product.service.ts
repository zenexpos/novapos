'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Product, ProductCreateInput, ProductImportAnalysis } from '@/lib/types';
import { db } from '@/lib/db';
import { calculateStockStatus, safeNumber, roundFinancial, safeToDate } from '@/lib/utils';
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
     * FACTORY : Centralise la création d'une entité Produit.
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
            flash: false,
            totalSold: 0,
            totalRevenue: 0
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
            const parts = filters.sortBy.split('_');
            const order = parts.pop();
            const field = parts.join('_');
            const isAsc = order === 'asc';

            products.sort((a: any, b: any) => {
                let valA: any = a[field] ?? 0;
                let valB: any = b[field] ?? 0;
                
                if (field === 'margin') {
                    valA = a.price > 0 ? (a.price - a.purchasePrice) / a.price : 0;
                    valB = b.price > 0 ? (b.price - b.purchasePrice) / b.price : 0;
                }

                if (typeof valA === 'string') return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
                return isAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
            });
        } else {
             products.sort((a, b) => safeToDate(b.updatedAt).getTime() - safeToDate(a.updatedAt).getTime());
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

        const update: Partial<Product> = { 
            ...data, 
            updatedAt: new Date(), 
            syncStatus: 'pending' as const 
        };
        
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

    async updateProductFromIntake(uuid: string, data: { purchasePrice: number; price?: number }): Promise<void> {
        const existing = await db.products.where('uuid').equals(uuid).first();
        if (!existing?.id) return;

        const update: Partial<Product> = {
            purchasePrice: data.purchasePrice,
            updatedAt: new Date(),
            syncStatus: 'pending' as const
        };

        if (data.price !== undefined) {
            update.price = data.price;
        }

        await db.products.update(existing.id!, update);
    }

    async duplicateProduct(uuid: string): Promise<Product> {
        const existing = await db.products.where('uuid').equals(uuid).first();
        if (!existing) throw new Error("Produit original introuvable");

        const newInput: ProductCreateInput = {
            name: `${existing.name} (Copie)`,
            price: existing.price,
            purchasePrice: existing.purchasePrice,
            quantity: 0,
            minStockLevel: existing.minStockLevel,
            barcodes: [],
            unit: existing.unit,
            category: existing.category,
            dateExpiration: existing.dateExpiration,
            supplierUuid: existing.supplierUuid
        };

        return this.addProduct(newInput);
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

    async bulkDelete(uuids: string[]): Promise<void> {
        await db.transaction('rw', [db.products, db.sync_queue], async () => {
            for (const uuid of uuids) {
                await this.deleteProduct(uuid);
            }
        });
    }

    async analyzeImport(file: File): Promise<ProductImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const existingProducts = await this.getProducts();
                    const analysis: ProductImportAnalysis = {
                        productsToAdd: [],
                        productsToUpdate: [],
                        skippedRows: [],
                        errorRows: [],
                        totalRows: results.data.length
                    };

                    for (const row of results.data as any[]) {
                        const name = row.name || row.Nom || row.Désignation;
                        if (!name) {
                            analysis.errorRows.push({ ...row, error: "Nom manquant" });
                            continue;
                        }

                        const productData: ProductCreateInput = {
                            name: name.trim(),
                            price: safeNumber(row.price || row.Prix_Vente || row.Prix),
                            purchasePrice: safeNumber(row.purchasePrice || row.Prix_Achat || row.PMP),
                            quantity: safeNumber(row.quantity || row.Stock || 0),
                            minStockLevel: safeNumber(row.minStockLevel || row.Seuil || 10),
                            unit: (row.unit || row.Unité || row.Unite || 'Pièce') as any,
                            category: row.category || row.Catégorie || row.Categorie || 'Général',
                            barcodes: row.barcodes ? (typeof row.barcodes === 'string' ? row.barcodes.split(',').map((b: string) => b.trim()) : []) : []
                        };

                        const existing = existingProducts.find(p => p.name.toLowerCase() === productData.name.toLowerCase());

                        if (existing) {
                            analysis.productsToUpdate.push({ ...productData, uuid: existing.uuid } as any);
                        } else {
                            analysis.productsToAdd.push(productData as any);
                        }
                    }
                    resolve(analysis);
                },
                error: (err) => reject(err)
            });
        });
    }

    async executeImport(data: { toAdd: any[], toUpdate: any[] }): Promise<void> {
        await db.transaction('rw', [db.products, db.sync_queue, db.inventory_logs], async () => {
            for (const item of data.toAdd) {
                await this.addProduct(item);
            }
            for (const item of data.toUpdate) {
                const { uuid, ...rest } = item;
                await this.updateProduct(uuid, rest);
            }
        });
    }
}

export const productService = new ProductService();
