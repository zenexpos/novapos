import { BaseEntity } from './common';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product extends BaseEntity {
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
    minStockLevel: number;
    barcodes: string[];
    unit?: 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
    category?: string;
    dateExpiration?: Date;
    supplierUuid?: string;
    priceUpdatedAt?: Date;
    stockStatus: StockStatus;
    flash?: boolean;
    lastSaleDate?: Date;
}

/**
 * DTO pour la création d'un produit (UI -> Service)
 */
export interface ProductCreateInput {
    name: string;
    price: number;
    purchasePrice: number;
    quantity?: number;
    minStockLevel?: number;
    barcodes?: string[];
    unit?: Product['unit'];
    category?: string;
    dateExpiration?: Date;
    supplierUuid?: string;
}

export interface ProductImportAnalysis {
    productsToAdd: Partial<Product>[];
    productsToUpdate: Partial<Product>[];
    skippedRows: any[];
    errorRows: any[];
    totalRows: number;
}
