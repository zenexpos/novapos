/**
 * @fileOverview General UI and Logic helpers.
 */
import { roundFinancial } from './math';

/**
 * Determines stock status based on current quantity and threshold.
 */
export function calculateStockStatus(quantity: number, minStockLevel: number): 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock' {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity <= minStockLevel) return 'low_stock';
    if (quantity > minStockLevel * 10) return 'overstock';
    return 'in_stock';
}

/**
 * Calculates a margin rate based on price and cost.
 */
export function calculateMarginRate(price: number, cost: number): number {
    if (price <= 0) return 0;
    return ((price - cost) / price) * 100;
}

/**
 * Calculates the Nisab threshold based on gold price (85g of gold).
 */
export function calculateNisab(goldPricePerGram: number): number {
    return goldPricePerGram * 85;
}

/**
 * Calculates Zakat (2.5% of net assets if above Nisab).
 */
export function calculateZakat(netAssets: number, goldPricePerGram: number): { due: boolean; amount: number } {
    const nisab = calculateNisab(goldPricePerGram);
    const isDue = netAssets >= nisab;
    return {
        due: isDue,
        amount: isDue ? roundFinancial(netAssets * 0.025) : 0
    };
}
