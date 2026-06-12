'use client';

import { BaseEntity } from './common';

export type ExpenseCategory = 
    | 'Loyer' 
    | 'Salaires' 
    | 'Fournisseurs' 
    | 'Services Publics' 
    | 'Marketing' 
    | 'Maintenance' 
    | 'Assurance' 
    | 'Transport' 
    | 'Autre';

/**
 * Entité complète stockée en base de données.
 */
export interface Expense extends BaseEntity {
    description: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date;
}

/**
 * Modèle de données pour le formulaire (UI).
 * Ne contient aucune métadonnée technique (sync, version, id).
 */
export interface ExpenseFormData {
    description: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date;
}
