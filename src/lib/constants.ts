import type { DatePreset } from './types/common';

/**
 * @fileOverview iPOS Zen Global Constants (Audited).
 */

export * from './constants/app';

// ── Bread Constants ──────────────────────────────────────────────────────────
/**
 * Array mapping for Date.getDay() (0 = Sunday, 1 = Monday, etc.)
 */
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
