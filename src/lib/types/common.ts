export type SyncStatus = 'synced' | 'pending' | 'failed' | 'idle' | 'syncing' | 'success' | 'error';
export type NetworkStatus = 'online' | 'offline' | 'degraded';
export type ViewMode = 'grid' | 'list' | 'compact';

export interface BaseEntity {
    id?: number;
    uuid: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    syncStatus: SyncStatus;
    version: number;
}

export interface SyncQueueItem {
    id?: number;
    table: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    payload: any;
    timestamp: number;
}

export interface DatePreset {
    label: string;
    days: number;
}

export interface CompanyProfile extends BaseEntity {
    companyName: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
    rcNumber?: string;
    nif?: string;
    aiNumber?: string;
    nisNumber?: string;
    legalForm?: string;
    tvaRate?: number;
    isTvaExempt?: boolean;
    tvaExemptReason?: string;
    invoicePrefix?: string;
    invoiceCounter?: number;
    breadCounter?: number;
    proformaCounter?: number;
    goldPricePerGram?: number;
    breadPrice?: number;
    zakatUseSalePrice?: boolean;
    supabaseUrl?: string;
    supabaseKey?: string;
    lastSyncAt?: Date;
}
