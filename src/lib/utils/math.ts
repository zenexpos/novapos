/**
 * iPOS Math Engine — Professional Precision Core.
 * Solves floating point issues to ensure accounting-grade accuracy using Number.EPSILON.
 */

export const FINANCIAL_PRECISION = 2;
export const QTY_PRECISION = 3;
export const FINANCIAL_EPSILON = Number.EPSILON;

/**
 * Standard Financial Rounding (2 decimals).
 */
export function roundFinancial(value: number): number {
    if (isNaN(value) || !isFinite(value)) return 0;
    // High-precision rounding using epsilon to handle floating point errors
    return Math.round((value + FINANCIAL_EPSILON) * 100) / 100;
}

/**
 * Quantity Rounding (3 decimals for weights).
 */
export function roundQty(value: number): number {
    if (isNaN(value) || !isFinite(value)) return 0;
    const multiplier = Math.pow(10, QTY_PRECISION);
    return Math.round((value + FINANCIAL_EPSILON) * multiplier) / multiplier;
}

/**
 * Cleans and secures a number, avoids NaN.
 */
export function safeNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) || !isFinite(val) ? 0 : val;
    if (val === null || val === undefined) return 0;
    if (typeof val === 'string') {
        const parsed = parseFloat(val.replace(/[^0-9.-]+/g, ""));
        return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
    }
    return 0;
}

/**
 * Multiplication with financial precision.
 */
export function preciseMultiply(a: number, b: number): number {
    return roundFinancial(safeNumber(a) * safeNumber(b));
}

/**
 * Calculate cart totals with absolute precision and per-line rounding.
 */
export function calculateCartTotals(cart: { items: any[], discount?: { type: string, value: number } }) {
    const subtotal = cart.items.reduce((acc, item) => {
        const qty = safeNumber(item.cartQuantity || item.quantity);
        const price = safeNumber(item.price);
        // CRITICAL FIX: Round each line item to prevent floating point drift during accumulation
        return acc + roundFinancial(price * qty);
    }, 0);

    let discountAmount = 0;
    if (cart.discount) {
        if (cart.discount.type === 'percentage') {
            discountAmount = roundFinancial((subtotal * safeNumber(cart.discount.value)) / 100);
        } else {
            discountAmount = roundFinancial(safeNumber(cart.discount.value));
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
 * Robust TVA Calculation.
 */
export function calculateTVA(totalTTC: number, tvaRate: number): { ht: number, tva: number } {
    const rate = safeNumber(tvaRate);
    if (rate === 0) return { ht: roundFinancial(totalTTC), tva: 0 };
    const ht = roundFinancial(totalTTC / (1 + rate / 100));
    const tva = roundFinancial(totalTTC - ht);
    return { ht, tva };
}

/**
 * Converts TTC amount to HT.
 */
export function ttcToHt(totalTTC: number, tvaRate: number): number {
    return calculateTVA(totalTTC, tvaRate).ht;
}

/**
 * Calculates Zakat based on net assets.
 */
export function calculateZakat(netAssets: number, goldPrice: number): { due: boolean; amount: number } {
    const nisab = goldPrice * 85;
    if (netAssets >= nisab) {
        return { due: true, amount: roundFinancial(netAssets * 0.025) };
    }
    return { due: false, amount: 0 };
}

/**
 * Calculates Nisab threshold.
 */
export function calculateNisab(goldPrice: number): number {
    return roundFinancial(safeNumber(goldPrice) * 85);
}
