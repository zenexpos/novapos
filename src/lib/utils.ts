import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Product } from './types';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES FINANCIÈRES
// ─────────────────────────────────────────────────────────────────────────────

export const FINANCIAL_EPSILON = 0.00001;
export const TVA_RATE_STANDARD = 19;
export const TVA_RATE_REDUIT = 9;

// ─────────────────────────────────────────────────────────────────────────────
// ARRONDI & SÉCURITÉ
// ─────────────────────────────────────────────────────────────────────────────

export function roundFinancial(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function safeToDate(date: Date | string | undefined | null): Date {
    if (!date) return new Date(0);
    if (date instanceof Date) return isNaN(date.getTime()) ? new Date(0) : date;
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date(0) : d;
}

export function safeToDateOrUndefined(date: Date | string | undefined | null): Date | undefined {
    if (!date) return undefined;
    if (date instanceof Date) return isNaN(date.getTime()) ? undefined : date;
    const d = new Date(date);
    return isNaN(d.getTime()) ? undefined : d;
}

export function safeNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === null || val === undefined || val === '') return 0;
    let str = String(val).trim().replace(/\s/g, '').replace(/[^\d.,-]/g, '');
    if (str.includes(',') && !str.includes('.')) {
        str = str.replace(',', '.');
    } else if (str.includes(',') && str.includes('.')) {
        const lastDot = str.lastIndexOf('.');
        const lastComma = str.lastIndexOf(',');
        if (lastDot > lastComma) { str = str.replace(/,/g, ''); }
        else { str = str.replace(/\./g, '').replace(',', '.'); }
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
}

export function preciseMultiply(a: number, b: number): number {
    return Math.round(safeNumber(a) * safeNumber(b) * 10000) / 10000;
}

export function safeDivide(a: number, b: number): number {
    if (b === 0 || Math.abs(b) < FINANCIAL_EPSILON) return 0;
    return a / b;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULS TVA & MARGES
// ─────────────────────────────────────────────────────────────────────────────

export function calculateTVA(priceHT: number, tvaRate: number = TVA_RATE_STANDARD): number {
    return roundFinancial(preciseMultiply(priceHT, tvaRate / 100));
}

export function htToTtc(priceHT: number, tvaRate: number = TVA_RATE_STANDARD): number {
    return roundFinancial(priceHT * (1 + tvaRate / 100));
}

export function ttcToHt(priceTTC: number, tvaRate: number = TVA_RATE_STANDARD): number {
    return roundFinancial(priceTTC / (1 + tvaRate / 100));
}

export function calculateMargin(salePrice: number, purchasePrice: number): number {
    return roundFinancial(safeNumber(salePrice) - safeNumber(purchasePrice));
}

export function calculateMarginRate(salePrice: number, purchasePrice: number): number {
    const pp = safeNumber(purchasePrice);
    if (pp <= 0) return 0;
    return roundFinancial(((safeNumber(salePrice) - pp) / pp) * 100);
}

export function calculateMarkupRate(salePrice: number, purchasePrice: number): number {
    const sp = safeNumber(salePrice);
    if (sp <= 0) return 0;
    return roundFinancial(((sp - safeNumber(purchasePrice)) / sp) * 100);
}

export function applyCoefficient(purchasePrice: number, coefficient: number): number {
    return roundFinancial(preciseMultiply(purchasePrice, coefficient));
}

export function priceFromMarginRate(purchasePrice: number, targetMarginRate: number): number {
    const pp = safeNumber(purchasePrice);
    const rate = safeNumber(targetMarginRate);
    if (rate >= 100) return 0;
    return roundFinancial(pp / (1 - rate / 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULS PANIER & REMISES
// ─────────────────────────────────────────────────────────────────────────────

interface CalculableCart {
    items: { price: number; cartQuantity: number }[];
    discount: { type: 'fixed' | 'percentage'; value: number };
}

export function calculateCartTotals(cart: CalculableCart) {
    const subtotalCents = cart.items.reduce((acc, item) => {
        return acc + Math.round(safeNumber(item.price) * safeNumber(item.cartQuantity) * 100);
    }, 0);
    const subtotal = subtotalCents / 100;
    let discountAmountCents = 0;
    if (cart.discount.type === 'percentage') {
        discountAmountCents = Math.round((subtotalCents * safeNumber(cart.discount.value)) / 100);
    } else {
        discountAmountCents = Math.round(safeNumber(cart.discount.value) * 100);
    }
    discountAmountCents = Math.min(discountAmountCents, subtotalCents);
    const totalCents = Math.max(0, subtotalCents - discountAmountCents);
    return { subtotal, discountAmount: discountAmountCents / 100, total: totalCents / 100 };
}

export function calculateDiscount(subtotal: number, type: 'fixed' | 'percentage', value: number): number {
    const sub = safeNumber(subtotal);
    const val = safeNumber(value);
    if (type === 'percentage') return roundFinancial(Math.min(sub, sub * val / 100));
    return roundFinancial(Math.min(sub, val));
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULS STOCK & ZAKAT
// ─────────────────────────────────────────────────────────────────────────────

export function calculateStockStatus(
    quantity: number | string,
    minStockLevel: number | string,
): Product['stockStatus'] {
    const qty = safeNumber(quantity);
    const min = safeNumber(minStockLevel);
    if (qty <= 0) return 'out_of_stock';
    if (min > 0 && qty <= min) return 'low_stock';
    return 'in_stock';
}

export function calculateStockValue(quantity: number, purchasePrice: number): number {
    return roundFinancial(preciseMultiply(safeNumber(quantity), safeNumber(purchasePrice)));
}

export function calculateNisab(goldPricePerGram: number): number {
    return roundFinancial(safeNumber(goldPricePerGram) * 85);
}

export function calculateZakat(netAssets: number, goldPricePerGram: number) {
    const nisab = calculateNisab(goldPricePerGram);
    const assets = safeNumber(netAssets);
    if (assets <= 0 || assets < nisab) return { due: false, nisab, amount: 0 };
    return { due: true, nisab, amount: roundFinancial(assets * 0.025) };
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATAGE
// ─────────────────────────────────────────────────────────────────────────────

export function formatCurrency(value: number | string, currency = 'DA'): string {
    const numValue = safeNumber(value);
    return `${numValue.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatCurrencyCompact(value: number, currency = 'DA'): string {
    const num = safeNumber(value);
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M ${currency}`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}k ${currency}`;
    return formatCurrency(num, currency);
}

export function formatPercent(value: number, decimals = 1): string {
    return `${safeNumber(value).toFixed(decimals)}%`;
}

export function formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// DATES
// ─────────────────────────────────────────────────────────────────────────────

export function isToday(date: Date | string | null | undefined): boolean {
    if (!date) return false;
    const d = safeToDate(date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function startOfDayLocal(date: Date): Date {
    const d = new Date(date); d.setHours(0, 0, 0, 0); return d;
}

export function endOfDayLocal(date: Date): Date {
    const d = new Date(date); d.setHours(23, 59, 59, 999); return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

export function shortId(length = 6): string {
    return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}

export function normalizeSearch(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}
