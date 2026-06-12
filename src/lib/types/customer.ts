import { BaseEntity } from './common';

export type DebtStatus = 'none' | 'due_soon' | 'overdue';

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
    bread_type_recurrence?: 'quotidien' | 'jours_specifiques' | 'aucun';
    bread_quantite_defaut?: number;
    bread_jours_semaine?: Record<string, { actif: boolean; quantite: number }>;
    bread_date_debut?: string;
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
