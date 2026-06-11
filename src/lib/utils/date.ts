/**
 * @fileOverview Date utility helpers.
 */

export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';

export function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}
