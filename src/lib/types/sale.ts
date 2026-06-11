import { BaseEntity } from './common';

export type SaleStatus = 'paid' | 'partial' | 'unpaid';

export interface SaleItem {
    productUuid: string | null;
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
    tva_rate?: number;
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
    customerUuid?: string;
    dueDate?: Date;
    isCancelled?: boolean;
    cancelledAt?: Date;
}
