import { BaseEntity } from './common';

export interface Supplier extends BaseEntity {
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    balance: number;
}

export interface SupplierPayment extends BaseEntity {
    supplierUuid: string;
    amount: number;
    paymentDate: Date;
    method: 'cash' | 'check' | 'transfer';
    notes?: string;
}
