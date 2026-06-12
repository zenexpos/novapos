import { format as fnsFormat, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * @fileOverview Standardisation du traitement des dates pour iPOS Zen.
 * Centralise la locale française et garantit la résilience du rendu.
 */

export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
export const DEFAULT_TIME_FORMAT = 'HH:mm';
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';

/**
 * Safe conversion from string/Date/number to Date object.
 * Returns a sentinel date (epoch 0) if invalid to prevent crashes.
 */
export function safeToDate(date: Date | string | number | undefined | null): Date {
    if (!date) return new Date(0);
    if (date instanceof Date) return isValid(date) ? date : new Date(0);
    
    let d: Date;
    if (typeof date === 'string') {
        d = parseISO(date);
        if (!isValid(d)) d = new Date(date);
    } else {
        d = new Date(date);
    }
    
    return isValid(d) ? d : new Date(0);
}

/**
 * Formatte une date avec gestion de la locale FR par défaut.
 * Retourne un tiret '—' si la date est invalide (sentinel date).
 */
export function formatDate(date: Date | string | number | undefined | null, formatStr = DEFAULT_DATE_FORMAT): string {
    const d = safeToDate(date);
    if (d.getTime() === 0) return '—';
    return fnsFormat(d, formatStr, { locale: fr });
}

/**
 * Formatte une date et une heure.
 */
export function formatDateTime(date: Date | string | number | undefined | null): string {
    return formatDate(date, DEFAULT_DATETIME_FORMAT);
}

/**
 * Formatte une date longue (ex: Lundi 12 Mai 2025).
 */
export function formatDateLong(date: Date | string | number | undefined | null): string {
    return formatDate(date, 'EEEE d MMMM yyyy');
}

/**
 * Formate un mois/année pour les graphiques (ex: Mai 25).
 */
export function formatMonthYear(date: Date | string | number | undefined | null): string {
    return formatDate(date, 'MMM yy');
}

/**
 * Formats a date for IndexedDB string indexing (YYYY-MM-DD).
 */
export function formatDateToYYYYMMDD(date: Date): string {
    if (!isValid(date)) return fnsFormat(new Date(), 'yyyy-MM-dd');
    return fnsFormat(date, 'yyyy-MM-dd');
}

/**
 * Vérifie si deux dates sont le même jour.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}
