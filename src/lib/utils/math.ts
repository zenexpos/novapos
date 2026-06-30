/**
 * iPOS Math Engine — Professional Precision Core.
 * Audit Zero Defect : Utilisation stricte de Number.EPSILON pour neutraliser la dérive binaire.
 */

export const FINANCIAL_PRECISION = 2;
export const QTY_PRECISION = 3;
export const FINANCIAL_EPSILON = Number.EPSILON;

/**
 * Arrondi financier standard (2 décimales).
 * Version durcie avec garde Epsilon pour éviter 0.1+0.2 != 0.3
 */
export function roundFinancial(value: number): number {
    if (isNaN(value) || !isFinite(value)) return 0;
    const factor = Math.pow(10, FINANCIAL_PRECISION);
    // On ajoute Epsilon avant de multiplier pour assurer que l'arrondi se fait sur la valeur représentable la plus proche
    return Math.round((value + FINANCIAL_EPSILON) * factor) / factor;
}

/**
 * Arrondi des quantités (3 décimales pour les poids).
 */
export function roundQty(value: number): number {
    if (isNaN(value) || !isFinite(value)) return 0;
    const multiplier = Math.pow(10, QTY_PRECISION);
    return Math.round((value + FINANCIAL_EPSILON) * multiplier) / multiplier;
}

/**
 * Nettoie et sécurise un nombre, évite NaN.
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
 * Multiplication avec précision financière.
 * Crucial pour éviter l'accumulation d'erreurs dans le grand livre.
 */
export function preciseMultiply(a: number, b: number): number {
    return roundFinancial(safeNumber(a) * safeNumber(b));
}

/**
 * Calcule les totaux du panier avec une précision absolue par ligne.
 */
export function calculateCartTotals(cart: { items: any[], discount?: { type: string, value: number } }) {
    const subtotal = cart.items.reduce((acc, item) => {
        const qty = safeNumber(item.cartQuantity || item.quantity);
        const price = safeNumber(item.price);
        return acc + roundFinancial(preciseMultiply(price, qty));
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
 * Calcul de TVA robuste.
 */
export function calculateTVA(totalTTC: number, tvaRate: number): { ht: number, tva: number } {
    const rate = safeNumber(tvaRate);
    if (rate === 0) return { ht: roundFinancial(totalTTC), tva: 0 };
    const ht = roundFinancial(totalTTC / (1 + rate / 100));
    const tva = roundFinancial(totalTTC - ht);
    return { ht, tva };
}

/**
 * Convertit un montant TTC en HT.
 */
export function ttcToHt(totalTTC: number, tvaRate: number): number {
    return calculateTVA(totalTTC, tvaRate).ht;
}

/**
 * Calcule le seuil du Nissab basé sur le prix de l'or (85g).
 */
export function calculateNisab(goldPricePerGram: number): number {
    return roundFinancial(safeNumber(goldPricePerGram) * 85);
}

/**
 * Calcule la Zakat (2.5% des actifs nets si > Nissab).
 */
export function calculateZakat(netAssets: number, goldPricePerGram: number): { due: boolean; amount: number } {
    const nisab = calculateNisab(goldPricePerGram);
    const assets = safeNumber(netAssets);
    const isDue = assets >= nisab && nisab > 0;
    return {
        due: isDue,
        amount: isDue ? roundFinancial(assets * 0.025) : 0
    };
}
