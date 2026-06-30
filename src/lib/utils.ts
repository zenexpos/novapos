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
export * from './utils/validation';
