import type { Customer, DatePreset } from './types';

// ── Bread ────────────────────────────────────────────────────────────────────
export const BREAD_WEEK_DAYS: (keyof NonNullable<Customer['bread_jours_semaine']>)[] = [
    'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi',
];

export const BREAD_WEEK_DAY_LABELS_FULL: Record<string, string> = {
    lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi',
    jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche',
};

// ── Date presets ─────────────────────────────────────────────────────────────
export const DATE_PRESETS: DatePreset[] = [
    { label: 'Aujourd\'hui', days: 0  },
    { label: '7 derniers jours',  days: 6  },
    { label: '30 derniers jours', days: 29 },
    { label: '90 derniers jours', days: 89 },
    { label: 'Cette année',       days: 364 },
];

// ── App ──────────────────────────────────────────────────────────────────────
export const APP_NAME    = 'iPOS Zen';
export const APP_VERSION = '2.0.0';

export const DB_KEY      = 'ipos-app-store';
export const CART_KEY    = 'ipos-cart-store';
export const THEME_KEY   = 'ipos-theme';
