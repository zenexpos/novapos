import { BaseEntity } from './common';
import { Product } from './product';

export type SaleStatus = 'paid' | 'partial' | 'unpaid';

export interface SaleItem {
    productUuid: string | null;
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
    tvaRate?: number;
}

export interface Sale extends BaseEntity {
    invoiceNumber: string;
    items: SaleItem[];
    subtotal: number;
    discountType?: 'fixed' | 'percentage';
    discountAmount: number;
    total: number;
    amountPaid: number;
    remainingBalance: number;
    paymentStatus: SaleStatus;
    customerUuids: string[]; // Updated to support multiple customers
    dueDate?: Date;
    isCancelled?: boolean;
    cancelledAt?: Date;
}

export interface CartItem extends Product {
    cartQuantity: number;
}

export interface Cart {
    id: string;
    name: string;
    items: CartItem[];
    customerUuids: string[]; // Updated to support multiple customers
    discount: {
        type: 'fixed' | 'percentage';
        value: number;
    };
}

export interface ReturnItem {
    productUuid: string | null;
    productName: string;
    quantity: number;
    price: number;
    purchasePrice: number;
    wasRestocked: boolean;
}

export interface ProductReturn extends BaseEntity {
    originalSaleUuid: string;
    originalInvoiceNumber: string;
    items: ReturnItem[];
    totalReturnValue: number;
    amountRefunded: number;
    customerUuid?: string;
    notes?: string;
}

/**
 * DTO pour la création d'un retour marchandise.
 */
export interface ReturnCreateInput {
    originalSaleUuid: string;
    items: ReturnItem[];
    totalReturnValue: number;
    amountRefunded: number;
    customerUuid?: string;
    notes?: string;
}
