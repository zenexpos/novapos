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
        const results = await db.products.toArray();
        if (options?.sortBy) {
            const [field, order] = options.sortBy.split('_');
            const isAsc = order === 'asc';
            results.sort((a: any, b: any) => {
                const valA = a[field];
                const valB = b[field];
                if (valA < valB) return isAsc ? -1 : 1;
                if (valA > valB) return isAsc ? 1 : -1;
                return 0;
            });
        }
        return results;
    }
    
    async getProductsByUuids(uuids: string[]): Promise<Product[]> {
        if (uuids.length === 0) return [];
        return db.products.where('uuid').anyOf(uuids).toArray();
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

        if (filters.signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        if (filters.stockStatus === 'expired') {
            products = await db.products.where('dateExpiration').below(now).toArray();
        } else if (filters.stockStatus === 'expiring_soon') {
            products = await db.products.where('dateExpiration').between(now, thirtyDaysFromNow, true, true).toArray();
        } else if (filters.stockStatus && ['in_stock', 'low_stock', 'out_of_stock'].includes(filters.stockStatus)) {
            products = await db.products.where('stockStatus').equals(filters.stockStatus).toArray();
        } else if (filters.supplierUuid && filters.supplierUuid !== 'all') {
            products = await db.products.where('supplierUuid').equals(filters.supplierUuid).toArray();
        } else {
            products = await db.products.toArray();
        }

        if (filters.signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

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
            
            products.sort((a: any, b: any) => {
                const valA = a[field];
                const valB = b[field];
                if (valA === undefined && valB === undefined) return 0;
                if (valA === undefined) return 1; 
                if (valB === undefined) return -1;
                if (valA < valB) return isAsc ? -1 : 1;
                if (valA > valB) return isAsc ? 1 : -1;
                return 0;
            });
        } else {
            products.sort((a,b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
        }

        return products;
    }

    async getProductByUuid(uuid: string): Promise<Product | undefined> {
        return db.products.where('uuid').equals(uuid).first();
    }

    async addProduct(productData: Omit<Product, 'uuid'> & { supplierName?: string }): Promise<Product> {
        let finalSupplierUuid = productData.supplierUuid;
        if (productData.supplierName) {
            const supplier = await supplierService.findOrCreateSupplier(productData.supplierName);
            finalSupplierUuid = supplier.uuid;
        }

        const dataForRepo = { ...productData };
        delete (dataForRepo as any).supplierName;

        const now = new Date();
        const qty = Number(safeNumber(productData.quantity).toFixed(3));
        const price = roundFinancial(safeNumber(productData.price));
        const purchasePrice = roundFinancial(safeNumber(productData.purchasePrice));
        
        const newProduct: Product = {
            ...(dataForRepo as Omit<Product, 'uuid'>),
            uuid: uuidv4(),
            quantity: qty,
            price: price,
            purchasePrice: purchasePrice,
            supplierUuid: finalSupplierUuid,
            createdAt: now,
            updatedAt: now,
            dateMajPrix: now,
            stockStatus: calculateStockStatus(qty, productData.minStockLevel),
        };
        const id = await db.products.add(newProduct);
        newProduct.id = id;

        triggerSync();
        return newProduct;
    }

    async updateProduct(uuid: string, productData: Partial<Product> & { supplierName?: string }): Promise<Product> {
        const existingProduct = await this.getProductByUuid(uuid);
        if (!existingProduct || !existingProduct.id) {
            throw new Error("Produit non trouvé.");
        }

        let finalSupplierUuid = productData.supplierUuid;
        if (productData.hasOwnProperty('supplierName')) {
            if (productData.supplierName) {
                 const supplier = await supplierService.findOrCreateSupplier(productData.supplierName, productData.supplierUuid);
                 finalSupplierUuid = supplier.uuid;
            } else {
                 finalSupplierUuid = undefined;
            }
        }
       
        const dataToUpdate: Partial<Product> = { ...productData };
        delete (dataToUpdate as any).supplierName;
        dataToUpdate.supplierUuid = finalSupplierUuid;
        dataToUpdate.updatedAt = new Date();

        if (productData.price !== undefined) dataToUpdate.price = roundFinancial(safeNumber(productData.price));
        if (productData.purchasePrice !== undefined) {
            dataToUpdate.purchasePrice = roundFinancial(safeNumber(productData.purchasePrice));
            if (dataToUpdate.purchasePrice !== existingProduct.purchasePrice) {
                dataToUpdate.dateMajPrix = new Date();
            }
        }

        const newQuantity = productData.quantity !== undefined 
            ? Number(safeNumber(productData.quantity).toFixed(3)) 
            : existingProduct.quantity;
        const newMinStock = productData.minStockLevel ?? existingProduct.minStockLevel;
        
        dataToUpdate.quantity = newQuantity;
        dataToUpdate.stockStatus = calculateStockStatus(newQuantity, newMinStock);
        
        await db.transaction('rw', [db.products, db.inventory_logs], async () => {
            if (productData.quantity !== undefined && Math.abs(newQuantity - existingProduct.quantity) > 0.0001) {
                const diff = Number((newQuantity - existingProduct.quantity).toFixed(3));
                const logEntry: InventoryLog = {
                    uuid: uuidv4(),
                    productUuid: uuid,
                    change: diff,
                    newQuantity: newQuantity,
                    reason: 'manual_adjustment',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                await db.inventory_logs.add(logEntry);
            }
            await db.products.update(existingProduct.id!, dataToUpdate);
        });

        triggerSync();
        return { ...existingProduct, ...dataToUpdate };
    }

    async duplicateProduct(uuid: string): Promise<Product> {
        const product = await this.getProductByUuid(uuid);
        if (!product) throw new Error("Produit original introuvable.");

        const { id, uuid: oldUuid, name, ...rest } = product;
        const duplicated = await this.addProduct({
            ...rest,
            name: `${name} (Copie)`,
            quantity: 0, 
        } as any);

        return duplicated;
    }

    async deleteProduct(uuid: string): Promise<void> {
        const hasLogs = await inventoryService.hasLogs(uuid);
        if (hasLogs) {
            throw new Error("Suppression impossible: ce produit a un historique de transactions.");
        }
        const product = await this.getProductByUuid(uuid);
        if (product?.id) {
            await db.products.delete(product.id);
            triggerSync();
        }
    }
    
    async bulkDelete(uuids: string[]): Promise<void> {
        for (const uuid of uuids) {
            const hasLogs = await inventoryService.hasLogs(uuid);
            if (hasLogs) {
                const product = await db.products.where('uuid').equals(uuid).first();
                throw new Error(`Suppression impossible: "${product?.name || 'inconnu'}" a un historique.`);
            }
        }
        const productsToDelete = await db.products.where('uuid').anyOf(uuids).toArray();
        const idsToDelete = productsToDelete.map(p => p.id!);
        await db.products.bulkDelete(idsToDelete);
        triggerSync();
    }

    async analyzeImport(file: File): Promise<ProductImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const analysis = await this._analyzeImportData(results.data);
                        resolve(analysis);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    reject(new Error("Erreur de parsing CSV: " + error.message));
                }
            });
        });
    }

    private async _analyzeImportData(csvData: any[]): Promise<ProductImportAnalysis> {
        const existingProducts = await this.getProducts();
        const existingNames = new Map(existingProducts.map(p => [p.name.toLowerCase().trim(), p]));

        const analysis: ProductImportAnalysis = {
            productsToAdd: [],
            productsToUpdate: [],
            skippedRows: [],
            errorRows: [],
            totalRows: csvData.length,
        };

        for (const row of csvData) {
            const name = row.name || row.nom || row.Désignation;
            const price = row.price || row.prix_vente || row.Prix;
            
            if (!name || !price) {
                analysis.errorRows.push({ ...row, error: "Nom ou prix manquant" });
                continue;
            }
            
            const existingProduct = existingNames.get(name.toLowerCase().trim());

            const productData = {
                name,
                price: safeNumber(price),
                purchasePrice: safeNumber(row.purchasePrice || row.purchase_price || row.Prix_Achat),
                quantity: safeNumber(row.quantity || row.stock || row.Stock),
                minStockLevel: safeNumber(row.minStockLevel || row.stock_min || row.Stock_Min),
                barcodes: row.barcodes ? String(row.barcodes).split(',').map((b:string) => b.trim()).filter(Boolean) : [],
                unite: row.unite || row.unité || 'Pièce',
            };

            if (existingProduct) {
                analysis.productsToUpdate.push({ ...productData, uuid: existingProduct.uuid });
            } else {
                analysis.productsToAdd.push(productData);
            }
        }
        return analysis;
    }

    async executeImport(confirmedData: { toAdd: any[], toUpdate: any[] }): Promise<void> {
        const now = new Date();
        const toAdd = confirmedData.toAdd.map(p => {
            const qty = Number(safeNumber(p.quantity).toFixed(3));
            return {
                ...p,
                uuid: uuidv4(),
                quantity: qty,
                price: roundFinancial(safeNumber(p.price)),
                purchasePrice: roundFinancial(safeNumber(p.purchasePrice)),
                createdAt: now,
                updatedAt: now,
                dateMajPrix: now,
                stockStatus: calculateStockStatus(qty, p.minStockLevel),
            };
        });
         const toUpdate = confirmedData.toUpdate.map(p => {
            const qty = Number(safeNumber(p.quantity).toFixed(3));
            return {
                ...p,
                quantity: qty,
                price: roundFinancial(safeNumber(p.price)),
                purchasePrice: roundFinancial(safeNumber(p.purchasePrice)),
                updatedAt: now,
                dateMajPrix: now,
                stockStatus: calculateStockStatus(qty, p.minStockLevel),
            };
        });
        await db.transaction('rw', [db.products], async () => {
            if (toAdd.length > 0) await db.products.bulkAdd(toAdd);
            if (toUpdate.length > 0) await db.products.bulkPut(toUpdate);
        });

        triggerSync();
    }

    async updateProductFromIntake(
        uuid: string,
        updates: { purchasePrice?: number; price?: number; barcodes?: string[] },
    ): Promise<void> {
        const product = await db.products.where('uuid').equals(uuid).first();
        if (!product?.id) return;
        const patch: Partial<Product> = { updatedAt: new Date(), dateMajPrix: new Date() };
        if (updates.purchasePrice !== undefined) patch.purchasePrice = roundFinancial(updates.purchasePrice);
        if (updates.price        !== undefined) patch.price         = roundFinancial(updates.price);
        if (updates.barcodes?.length)           patch.barcodes      = updates.barcodes;
        await db.products.update(product.id, patch);
    }

    async searchByBarcode(barcode: string): Promise<Product | undefined> {
        return db.products.where('barcodes').equals(barcode).first();
    }

    async getLowStockProducts(limit = 10): Promise<Product[]> {
        const products = await db.products.toArray();
        return products
            .filter(p => safeNumber(p.quantity) <= 0 || (safeNumber(p.minStockLevel) > 0 && safeNumber(p.quantity) <= safeNumber(p.minStockLevel)))
            .sort((a, b) => safeNumber(a.quantity) - safeNumber(b.quantity))
            .slice(0, limit);
    }

    async getExpiringProducts(daysAhead = 30): Promise<(Product & { daysUntilExpiry: number })[]> {
        const now = new Date();
        const products = await db.products.toArray();
        return products
            .filter(p => p.dateExpiration)
            .map(p => ({ ...p, daysUntilExpiry: Math.ceil((new Date(p.dateExpiration!).getTime() - now.getTime()) / 86_400_000) }))
            .filter(p => p.daysUntilExpiry <= daysAhead)
            .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    }
}

export const productService = new ProductService();
