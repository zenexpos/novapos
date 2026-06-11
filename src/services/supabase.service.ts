'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';
import type { SyncQueueItem, CompanyProfile } from '@/lib/types';

/**
 * Titanium Sync Engine — Version Entreprise
 * Gère la synchronisation bidirectionnelle incrémentale.
 */
class SupabaseSyncService {
    private isSyncing = false;

    async testConnection(url: string, key: string): Promise<boolean> {
        try {
            const supabase = getSupabaseClient(url, key);
            if (!supabase) return false;
            const { error } = await supabase.from('company_profile').select('uuid').limit(1);
            return !error || error.code === 'PGRST116';
        } catch {
            return false;
        }
    }

    async smartSync(url: string, key: string): Promise<void> {
        if (this.isSyncing) return;
        this.isSyncing = true;

        const supabase = getSupabaseClient(url, key);
        if (!supabase) {
            this.isSyncing = false;
            return;
        }

        try {
            // 1. PUSH : Envoyer les changements locaux
            await this.processSyncQueue(supabase);

            // 2. PULL : Récupérer les nouveautés du Cloud
            const profile = await db.company_profile.toCollection().first();
            const lastSync = profile?.last_sync_at ? new Date(profile.last_sync_at).toISOString() : new Date(0).toISOString();
            
            await this.pullRemoteChanges(supabase, lastSync);

            // 3. FINALISATION
            if (profile?.id) {
                await db.company_profile.update(profile.id, {
                    last_sync_at: new Date(),
                    syncStatus: 'synced'
                });
            }
        } catch (error) {
            console.error('[Titanium Sync] Audit Failure:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    private async processSyncQueue(supabase: any): Promise<void> {
        const queueItems = await db.sync_queue.orderBy('id').toArray();
        if (queueItems.length === 0) return;

        for (const item of queueItems) {
            try {
                const tableName = this.camelToSnake(item.table);
                const payload = this.sanitizeForCloud(item.payload);

                let error;
                if (item.operation === 'CREATE' || item.operation === 'UPDATE') {
                    const { error: upsertError } = await supabase
                        .from(tableName)
                        .upsert(payload, { onConflict: 'uuid' });
                    error = upsertError;
                } else if (item.operation === 'DELETE') {
                    const { error: deleteError } = await supabase
                        .from(tableName)
                        .update({ deleted_at: new Date().toISOString() })
                        .eq('uuid', item.payload.uuid);
                    error = deleteError;
                }

                if (!error) {
                    await db.sync_queue.delete(item.id!);
                }
            } catch (err) {
                console.warn(`[Sync Queue] Conflict on ${item.table}:`, err);
            }
        }
    }

    private async pullRemoteChanges(supabase: any, lastSync: string): Promise<void> {
        const tables = [
            'company_profile', 'suppliers', 'customers', 'products', 
            'expenses', 'stock_intakes', 'sales', 'product_returns', 
            'payments', 'bread_orders', 'inventory_logs'
        ];

        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .gt('updated_at', lastSync);

            if (error || !data || data.length === 0) continue;

            const dexieTable = (db as any)[this.snakeToCamel(table)];
            if (!dexieTable) continue;

            await db.transaction('rw', dexieTable, async () => {
                for (const remote of data) {
                    const local = await dexieTable.where('uuid').equals(remote.uuid).first();
                    const sanitizedRemote = this.mapToLocal(remote);

                    if (!local) {
                        await dexieTable.add({ ...sanitizedRemote, syncStatus: 'synced' });
                    } else if (new Date(sanitizedRemote.updatedAt) > new Date(local.updatedAt)) {
                        await dexieTable.update(local.id, { ...sanitizedRemote, syncStatus: 'synced' });
                    }
                }
            });
        }
    }

    private camelToSnake(str: string): string {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    private snakeToCamel(str: string): string {
        return str.replace(/(_[a-z])/g, m => m[1].toUpperCase());
    }

    private sanitizeForCloud(data: any): any {
        if (!data) return data;
        const clean: any = {};
        for (const key in data) {
            if (key === 'id') continue;
            const snakeKey = this.camelToSnake(key);
            let value = data[key];
            if (value instanceof Date) value = value.toISOString();
            clean[snakeKey] = value;
        }
        return clean;
    }

    private mapToLocal(record: Record<string, any>): any {
        const clean: any = {};
        for (const key in record) {
            const camelKey = this.snakeToCamel(key);
            let value = record[key];
            if (typeof value === 'string' && (key.endsWith('_at') || key.endsWith('_date') || key === 'date')) {
                const d = new Date(value);
                if (!isNaN(d.getTime())) value = d;
            }
            clean[camelKey] = value;
        }
        return clean;
    }

    async push(url: string, key: string) { await this.processSyncQueue(getSupabaseClient(url, key)); }
    async pull(url: string, key: string) { 
        const profile = await db.company_profile.toCollection().first();
        const lastSync = profile?.last_sync_at ? new Date(profile.last_sync_at).toISOString() : new Date(0).toISOString();
        await this.pullRemoteChanges(getSupabaseClient(url, key), lastSync); 
    }
}

export const supabaseSyncService = new SupabaseSyncService();
