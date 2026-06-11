/**
 * @fileOverview Date utility helpers.
 */

export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';

export function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

/**
 * Formats a date for IndexedDB string indexing (YYYY-MM-DD)
 */
export function formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Safe conversion from string/Date to Date object
 */
export function safeToDate(date: Date | string | undefined | null): Date {
    if (!date) return new Date(0);
    if (date instanceof Date) return isNaN(date.getTime()) ? new Date(0) : date;
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date(0) : d;
}
