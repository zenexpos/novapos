/**
 * Moteur de calcul financier précis iPOS Math Engine.
 * Résout les problèmes de virgule flottante en JavaScript pour garantir la précision des factures.
 */

export const FINANCIAL_PRECISION = 2;
export const FINANCIAL_EPSILON = 0.001;

/**
 * Arrondi financier standard (2 décimales).
 */
export function roundFinancial(value: number): number {
    const multiplier = Math.pow(10, FINANCIAL_PRECISION);
    return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

/**
 * Nettoie et sécurise un nombre, évite les NaN.
 */
export function safeNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Multiplication avec précision financière.
 */
export function preciseMultiply(a: number, b: number): number {
    return roundFinancial(safeNumber(a) * safeNumber(b));
}

/**
 * Addition avec précision financière.
 */
export function preciseAdd(a: number, b: number): number {
    return roundFinancial(safeNumber(a) + safeNumber(b));
}

/**
 * Calcul des totaux du panier avec précision absolue.
 */
export function calculateCartTotals(cart: { items: any[], discount?: { type: string, value: number } }) {
    const subtotal = cart.items.reduce((acc, item) => {
        const qty = safeNumber(item.cartQuantity || item.quantity);
        const price = safeNumber(item.price);
        return acc + (price * qty);
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
 * Convertit un montant TTC en HT.
 */
export function ttcToHt(totalTTC: number, tvaRate: number): number {
    const rate = safeNumber(tvaRate);
    if (rate === 0) return totalTTC;
    return totalTTC / (1 + rate / 100);
}

/**
 * Calcule le montant de la TVA.
 */
export function calculateTVA(totalTTC: number, tvaRate: number): number {
    const ht = ttcToHt(totalTTC, tvaRate);
    return totalTTC - ht;
}

/**
 * Calcule le seuil du Nissab (85g d'or).
 */
export function calculateNisab(goldPrice: number): number {
    return roundFinancial(safeNumber(goldPrice) * 85);
}

/**
 * Calcule le montant de la Zakat (2.5% des actifs nets).
 */
export function calculateZakat(netAssets: number, goldPrice: number): { due: boolean; amount: number } {
    const nisab = calculateNisab(goldPrice);
    const assets = safeNumber(netAssets);
    const isEligible = assets >= nisab && nisab > 0;
    return {
        due: isEligible,
        amount: isEligible ? roundFinancial(assets * 0.025) : 0
    };
}
