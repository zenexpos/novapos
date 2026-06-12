'use client';

import { BaseEntity } from './common';
import { Customer } from './customer';

export type BreadPaymentStatus = 'paid' | 'unpaid' | 'partial';
export type BreadPickupStatus = 'received' | 'unreceived' | 'partial';

/**
 * Entité de domaine pour une commande de pain.
 */
export interface BreadOrder extends BaseEntity {
    orderNumber: string;
    customerUuid: string | null;
    customName?: string;
    date: string; // Format YYYY-MM-DD
    pickupDate: Date;
    pickupTime?: string; // Format HH:mm
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    amountPaid: number;
    remainingAmount: number;
    paymentStatus: BreadPaymentStatus;
    pickupStatus: BreadPickupStatus;
    isDelivered: boolean;
    isPaid: boolean;
    notes?: string;
    transferredToCustomerAccount: boolean;
    transferredAt?: Date;
    venteUuid: string | null;
}

/**
 * Data Transfer Object pour la création manuelle d'une commande.
 */
export interface CreateBreadOrderDTO {
    customerUuid?: string;
    customName?: string;
    date: string;
    quantity: number;
    unitPrice?: number;
    pickupTime?: string;
    notes?: string;
}

export interface BreadOrderWithCustomer extends BreadOrder {
    customer: Customer | null;
}
