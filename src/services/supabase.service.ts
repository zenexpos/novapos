'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';
import type { SyncQueueItem, CompanyProfile } from '@/lib/types';
import { toast } from 'sonner';

/**
 * @fileOverview Titanium Sync Engine — v2.9
 * Architecture Local-First : 
 * 1. Consomme le 'sync_queue' pour pousser les actions locales vers le Cloud.
 * 2. Effectue un 'pull' périodique pour synchroniser les changements distants.
 * 3. Utilise 'Last Updated Wins' pour la résolution de conflits.
 */
class SupabaseSyncService {
    private isSyncing = false;

    /**
     * Teste la connexion au coffre-fort Cloud.
     */
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

    /**
     * Déclenche une synchronisation intelligente bidirectionnelle.
     */
    async smartSync(url: string, key: string): Promise<void> {
        if (this.isSyncing) return;
        this.isSyncing = true;

        const supabase = getSupabaseClient(url, key);
        if (!supabase) {
            this.isSyncing = false;
            return;
        }

        try {
            // A. PUSH : Traiter le طابور المزامنة (Sync Queue)
            await this.processSyncQueue(supabase);

            // B. PULL : Récupérer les nouveautés du Cloud
            await this.pullRemoteChanges(supabase);

            // C. UPDATE : Marquer le succès dans le profil
            const profile = await db.company_profile.toCollection().first();
            if (profile?.id) {
                await db.company_profile.update(profile.id, {
                    last_sync_at: new Date(),
                    syncStatus: 'synced'
                });
            }
        } catch (error) {
            console.error('[Titanium Sync] Critical Failure:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Consomme le tableau 'sync_queue' localement et applique les opérations sur Supabase.
     */
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
                    // Soft delete on cloud is preferred
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
                console.warn(`[Sync Queue] Failed item ${item.id} on table ${item.table}:`, err);
            }
        }
    }

    /**
     * Récupère les records modifiés sur le Cloud depuis la dernière synchro.
     */
    private async pullRemoteChanges(supabase: any): Promise<void> {
        const tables = [
            'company_profile', 'suppliers', 'customers', 'products', 
            'expenses', 'stock_intakes', 'sales', 'product_returns', 
            'payments', 'bread_orders', 'inventory_logs', 'supplier_payments'
        ];

        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .order('updated_at', { ascending: false });

            if (error || !data) continue;

            const dexieTable = (db as any)[this.snakeToCamel(table)];
            if (!dexieTable) continue;

            await db.transaction('rw', dexieTable, async () => {
                for (const remote of data) {
                    const local = await dexieTable.where('uuid').equals(remote.uuid).first();
                    const sanitizedRemote = this.mapToLocal(remote);

                    if (!local) {
                        await dexieTable.add({ ...sanitizedRemote, syncStatus: 'synced' });
                    } else {
                        const localUpdate = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
                        const remoteUpdate = sanitizedRemote.updatedAt ? sanitizedRemote.updatedAt.getTime() : 0;

                        if (remoteUpdate > localUpdate) {
                            await dexieTable.update(local.id, { ...sanitizedRemote, syncStatus: 'synced' });
                        }
                    }
                }
            });
        }
    }

    async push(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (supabase) await this.processSyncQueue(supabase);
    }

    async pull(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (supabase) await this.pullRemoteChanges(supabase);
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
            if (typeof value === 'string' && (key.endsWith('_at') || key.endsWith('_date'))) {
                const d = new Date(value);
                if (!isNaN(d.getTime())) value = d;
            }
            clean[camelKey] = value;
        }
        return clean;
    }
}

export const supabaseSyncService = new SupabaseSyncService();
