import { BaseEntity } from './common';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product extends BaseEntity {
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
    minStockLevel: number;
    barcodes: string[];
    unite?: 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
    category?: string;
    dateExpiration?: Date;
    supplierUuid?: string;
    dateMajPrix?: Date;
    stockStatus: StockStatus;
    flash?: boolean;
}

/**
 * DTO pour la création d'un produit (UI -> Service)
 */
export interface ProductCreateInput {
    name: string;
    price: number;
    purchasePrice?: number;
    quantity?: number;
    minStockLevel?: number;
    barcodes?: string[];
    unite?: Product['unite'];
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
