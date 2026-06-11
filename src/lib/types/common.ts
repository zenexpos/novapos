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
