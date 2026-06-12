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
    zip_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo_url?: string;
    rc_number?: string;
    nif?: string;
    ai_number?: string;
    nis_number?: string;
    legal_form?: string;
    tva_rate?: number;
    is_tva_exempt?: boolean;
    tva_exempt_reason?: string;
    invoice_prefix?: string;
    invoice_counter?: number;
    bread_counter?: number;
    proforma_counter?: number;
    goldPricePerGram?: number;
    prix_pain?: number;
    zakat_use_sale_price?: boolean;
    supabase_url?: string;
    supabase_key?: string;
    last_sync_at?: Date;
}
