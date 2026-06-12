import { BaseEntity } from './common';
import { Customer } from './customer';

export type BreadPaymentStatus = 'paid' | 'unpaid' | 'partial';
export type BreadPickupStatus = 'received' | 'unreceived' | 'partial';

export interface BreadOrder extends BaseEntity {
    orderNumber: string;
    customerUuid: string | null;
    customName?: string;
    date: string; // YYYY-MM-DD
    pickupDate: Date;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    amountPaid: number;
    remainingAmount: number;
    paymentStatus: BreadPaymentStatus;
    pickupStatus: BreadPickupStatus;
    notes?: string;
    transferredToCustomerAccount: boolean;
    transferredAt?: Date;
    venteUuid: string | null;
}

export interface BreadOrderWithCustomer extends BreadOrder {
    customer: Customer | null;
}
