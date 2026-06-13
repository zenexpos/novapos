/**
 * @fileOverview General UI and Logic helpers.
 */

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
