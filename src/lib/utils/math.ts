/**
 * iPOS Math Engine — Professional Precision Core.
 * Solves floating point issues to ensure accounting-grade accuracy.
 */

export const FINANCIAL_PRECISION = 2;
export const QTY_PRECISION = 3; // For weights (0.000)
export const FINANCIAL_EPSILON = 0.001;

/**
 * Standard Financial Rounding (2 decimals).
 */
export function roundFinancial(value: number): number {
    const multiplier = Math.pow(10, FINANCIAL_PRECISION);
    return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

/**
 * Quantity Rounding (3 decimals for weights).
 */
export function roundQty(value: number): number {
    const multiplier = Math.pow(10, QTY_PRECISION);
    return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

/**
 * Cleans and secures a number, avoids NaN.
 */
export function safeNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Multiplication with financial precision.
 */
export function preciseMultiply(a: number, b: number): number {
    return roundFinancial(safeNumber(a) * safeNumber(b));
}

/**
 * Calculate cart totals with absolute precision.
 */
export function calculateCartTotals(cart: { items: any[], discount?: { type: string, value: number } }) {
    const subtotal = cart.items.reduce((acc, item) => {
        const qty = safeNumber(item.cartQuantity || item.quantity);
        const price = safeNumber(item.price);
        // Important: Subtotal per line is rounded to 2 decimals to match physical cash
        return acc + roundFinancial(price * qty);
    }, 0);

    let discountAmount = 0;
    if (cart.discount) {
        if (cart.discount.type === 'percentage') {
            discountAmount = (subtotal * safeNumber(cart.discount.value)) / 100;
        } else {
            discountAmount = safeNumber(cart.discount.value);
        }
    }

    const total = Math.max(0, subtotal - discountAmount);

    return {
        subtotal: roundFinancial(subtotal),
        discountAmount: roundFinancial(discountAmount),
        total: roundFinancial(total),
    };
}

/**
 * Converts TTC amount to HT.
 */
export function ttcToHt(totalTTC: number, tvaRate: number): number {
    const rate = safeNumber(tvaRate);
    if (rate === 0) return totalTTC;
    return totalTTC / (1 + rate / 100);
}

/**
 * Calculates TVA amount.
 */
export function calculateTVA(totalTTC: number, tvaRate: number): number {
    const ht = ttcToHt(totalTTC, tvaRate);
    return totalTTC - ht;
}
