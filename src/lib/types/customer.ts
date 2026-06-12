import { BaseEntity } from './common';

export type DebtStatus = 'none' | 'due_soon' | 'overdue';

/**
 * Profil logistique pour le module Pain.
 */
export interface BreadProfile {
    recurrenceType: 'quotidien' | 'jours_specifiques' | 'aucun';
    defaultQuantity: number;
    weeklySchedule: Record<string, { actif: boolean; quantite: number }>;
    startDate?: string;
}

/**
 * Entité complète stockée en base de données.
 */
export interface Customer extends BaseEntity {
    firstName: string;
    lastName: string;
    searchName: string;
    phone?: string;
    address?: string;
    settlementDay?: number;
    creditLimit?: number;
    initialBalance: number;
    totalSpent: number;
    outstandingBalance: number;
    lastActivityDate?: Date;
    debtStatus: DebtStatus;
    isOverLimit: boolean;
    
    // Bread Module Extension
    isBreadClient: boolean;
    breadProfile?: BreadProfile;
}

/**
 * Modèle de données pour le formulaire de CRÉATION (UI).
 */
export interface CustomerFormData {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    settlementDay?: number;
    creditLimit?: number;
    initialBalance: number;
    isBreadClient: boolean;
}

/**
 * Modèle pour la MISE À JOUR (DTO).
 */
export interface CustomerUpdateInput extends Partial<CustomerFormData> {
    breadProfile?: Partial<BreadProfile>;
}

export interface Payment extends BaseEntity {
    customerUuid: string;
    amount: number;
    paymentDate: Date;
    notes?: string;
}

export interface ImportAnalysis {
    customersToAdd: Partial<Customer>[];
    customersToUpdate: Partial<Customer>[];
    errorRows: any[];
    totalRows: number;
}

export interface ImportRow {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    initialBalance?: string | number;
    creditLimit?: string | number;
    [key: string]: any;
}
