/**
 * @fileOverview Centralized Enterprise Validation Engine for iPOS Zen.
 * Ensures data integrity across Sales, Inventory, and Finance domains.
 */

import { FINANCIAL_EPSILON } from './math';

export const Validators = {
    /**
     * Validates Algerian Phone Formats
     */
    phone: (val: string): boolean => {
        const cleaned = val.replace(/\s/g, '');
        return /^(05|06|07|02)\d{8}$/.test(cleaned);
    },

    /**
     * Validates NIF (Numéro d'Identification Fiscale) - 15 digits
     */
    nif: (val: string): boolean => {
        return /^\d{15}$/.test(val);
    },

    /**
     * Validates Currency Amounts
     */
    amount: (val: number): boolean => {
        return typeof val === 'number' && val >= 0;
    },

    /**
     * Checks if stock adjustment is valid (preventing negative inventory if required)
     */
    stockAdjustment: (current: number, change: number, allowNegative = false): boolean => {
        if (allowNegative) return true;
        return (current + change) >= -FINANCIAL_EPSILON;
    },

    /**
     * Mandatory string validation
     */
    required: (val: string | null | undefined): boolean => {
        return !!val && val.trim().length > 0;
    }
};
