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

export interface Expense extends BaseEntity {
    description: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date;
}
