import type { DatePreset } from './types/common';

/**
 * iPOS Zen - Constantes Globales Enterprise.
 */

export const APP_NAME = 'iPOS Zen';
export const APP_VERSION = '2.9.5';
export const COMPANY_DOMAIN = 'iposzen.com';

export const SYNC_INTERVAL_MS = 5 * 60 * 1000; 
export const BACKUP_REMINDER_DAYS = 7;

// ── Bread Constants ──────────────────────────────────────────────────────────
export const BREAD_WEEK_DAYS = [
    'dimanche',
    'lundi',
    'mardi',
    'mercredi',
    'jeudi',
    'vendredi',
    'samedi',
] as const;

export const BREAD_WEEK_DAY_LABELS_FULL: Record<string, string> = {
    lundi: 'Lundi', 
    mardi: 'Mardi', 
    mercredi: 'Mercredi',
    jeudi: 'Jeudi', 
    vendredi: 'Vendredi', 
    samedi: 'Samedi', 
    dimanche: 'Dimanche',
};

// ── Date presets ─────────────────────────────────────────────────────────────
export const DATE_PRESETS: DatePreset[] = [
    { label: 'Aujourd\'hui', days: 0  },
    { label: '7 derniers jours',  days: 6  },
    { label: '30 derniers jours', days: 29 },
    { label: '90 derniers jours', days: 89 },
    { label: 'Cette année',       days: 364 },
];
