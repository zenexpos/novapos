import { BaseEntity } from './common';

export type DebtStatus = 'none' | 'due_soon' | 'overdue';

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
    
    // Bread Module
    isBreadClient: boolean;
    breadRecurrenceType?: 'quotidien' | 'jours_specifiques' | 'aucun';
    breadDefaultQuantity?: number;
    breadWeeklySchedule?: Record<string, { actif: boolean; quantite: number }>;
    breadStartDate?: string;
}

/**
 * Modèle de données pour le formulaire de CRÉATION (UI).
 * Tous les champs de saisie texte sont obligatoires pour éviter undefined dans les inputs.
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
 * Permet des modifications partielles sans polluer avec les métadonnées techniques.
 */
export type CustomerUpdateInput = Partial<CustomerFormData> & {
    breadRecurrenceType?: 'quotidien' | 'jours_specifiques' | 'aucun';
    breadWeeklySchedule?: Record<string, { actif: boolean; quantite: number }>;
    breadStartDate?: string;
};

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
