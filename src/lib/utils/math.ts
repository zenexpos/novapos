import type { CartItem } from '../types';

/**
 * @fileOverview Precise financial math utilities.
 * Solves JavaScript floating point issues for POS calculations.
 */

export const FINANCIAL_EPSILON = 0.00001;

/**
 * Rounds a number to a fixed decimal for financial reporting.
 */
export function roundFinancial(val: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Ensures a value is a valid number, sanitizing common input errors.
 */
export function safeNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    
    const str = String(val).trim().replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Performs high-precision multiplication.
 */
export function preciseMultiply(a: number, b: number): number {
    return Math.round(safeNumber(a) * safeNumber(b) * 10000) / 10000;
}

/**
 * Calculates cart totals including subtotal, discount, and final total.
 */
export function calculateCartTotals(cart: { 
    items: CartItem[], 
    discount: { type: 'fixed' | 'percentage', value: number } 
}) {
    const subtotal = cart.items.reduce((acc, item) => 
        acc + roundFinancial(safeNumber(item.price) * safeNumber(item.cartQuantity)), 0
    );

    let discountAmount = 0;
    if (cart.discount.type === 'percentage') {
        discountAmount = roundFinancial((subtotal * safeNumber(cart.discount.value)) / 100);
    } else {
        discountAmount = roundFinancial(safeNumber(cart.discount.value));
    }

    const total = Math.max(0, roundFinancial(subtotal - discountAmount));

    return {
        subtotal: roundFinancial(subtotal),
        discountAmount,
        total
    };
}
