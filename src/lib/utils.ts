/**
 * @fileOverview Barrel file for Utilities.
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export * from './utils/math';
export * from './utils/currency';
export * from './utils/date';
export * from './utils/helpers';

// Shared date helper
export function safeToDate(date: Date | string | undefined | null): Date {
    if (!date) return new Date(0);
    if (date instanceof Date) return isNaN(date.getTime()) ? new Date(0) : date;
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date(0) : d;
}

export function formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
}
