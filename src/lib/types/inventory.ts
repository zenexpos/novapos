import { BaseEntity } from './common';

export type InventoryLogReason = 
    | 'sale' 
    | 'return' 
    | 'stock_intake' 
    | 'cancellation' 
    | 'manual_adjustment'
    | 'create_proforma_from_pos'
    | 'initial_stock'
    | 'import';

export interface InventoryLog extends BaseEntity {
    productUuid: string | null;
    change: number;
    newQuantity: number;
    reason: InventoryLogReason;
    relatedUuid?: string;
    details?: string;
}

export interface StockIntakeStoredItem {
    productUuid: string;
    productName: string;
    quantityReceived: number;
    quantityDamaged: number;
    purchasePrice: number;
    landingCost: number;
}

export interface StockIntakeItem {
    id: string;
    productUuid?: string;
    name: string;
    barcodes?: string[];
    quantity: number;
    quantityDamaged: number;
    purchasePrice: number;
    price: number;
    unit: string;
    isNew: boolean;
}

export interface StockIntake extends BaseEntity {
    supplierUuid?: string;
    invoiceNumber?: string;
    invoiceDate: Date;
    shippingCost: number;
    items: StockIntakeStoredItem[];
    totalValue: number;
}
