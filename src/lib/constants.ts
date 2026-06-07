import type { Customer, ExpenseCategory, DatePreset, StockUnit, PaymentMethod } from './types';

// ── Bread ────────────────────────────────────────────────────────────────────
export const BREAD_WEEK_DAYS: (keyof NonNullable<Customer['bread_jours_semaine']>)[] = [
    'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi',
];

export const BREAD_WEEK_DAY_LABELS: Record<string, string> = {
    lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer',
    jeudi: 'Jeu', vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim',
};

export const BREAD_WEEK_DAY_LABELS_FULL: Record<string, string> = {
    lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi',
    jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche',
};

// ── Stock ────────────────────────────────────────────────────────────────────
export const STOCK_UNITS: StockUnit[] = [
    'Pièce', 'Kg', 'Litre', 'Boîte', 'Carton', 'Sachet', 'Bouteille',
];

// ── Paiements ────────────────────────────────────────────────────────────────
export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: 'cash',     label: 'Espèces'  },
    { value: 'check',    label: 'Chèque'   },
    { value: 'transfer', label: 'Virement' },
    { value: 'ccp',      label: 'CCP'      },
];

// ── Dépenses ─────────────────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    'Loyer', 'Salaires', 'Fournisseurs',
    'Services Publics', 'Marketing', 'Maintenance', 'Autre',
];

// ── Date presets ─────────────────────────────────────────────────────────────
export const DATE_PRESETS: DatePreset[] = [
    { label: 'Aujourd\'hui', days: 0  },
    { label: '7 derniers jours',  days: 6  },
    { label: '30 derniers jours', days: 29 },
    { label: '90 derniers jours', days: 89 },
    { label: 'Cette année',       days: 364 },
];

// ── TVA ──────────────────────────────────────────────────────────────────────
export const TVA_RATES = [
    { value: 0,  label: 'Exonéré (0%)' },
    { value: 9,  label: 'Réduit (9%)'  },
    { value: 19, label: 'Normal (19%)' },
];

// ── Pagination ───────────────────────────────────────────────────────────────
export const PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

// ── App ──────────────────────────────────────────────────────────────────────
export const APP_NAME    = 'iPOS Zen';
export const APP_VERSION = '2.0.0';

export const DB_KEY      = 'ipos-app-store';
export const CART_KEY    = 'ipos-cart-store';
export const THEME_KEY   = 'ipos-theme';
export const AUTOPRINT_KEY = 'ipos-autoprint-enabled';
export const RECEIPT_FORMAT_KEY = 'ipos-receipt-format';
