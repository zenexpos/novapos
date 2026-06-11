import { safeNumber } from './math';

/**
 * @fileOverview Localized currency formatting for iPOS Zen (Algerian Dinar).
 */

export function formatCurrency(value: number | string, currency = 'DA'): string {
    const num = safeNumber(value);
    return `${num.toLocaleString('fr-DZ', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })} ${currency}`;
}

export function formatCurrencyCompact(value: number, currency = 'DA'): string {
    const num = safeNumber(value);
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M ${currency}`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k ${currency}`;
    return formatCurrency(num, currency);
}
