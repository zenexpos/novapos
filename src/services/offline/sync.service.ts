'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Titanium Sync Engine Enterprise.
 * Gère les conflits et la file d'attente de synchronisation de manière transactionnelle.
 */
class SyncService {
    private isSyncing = false;

    /**
     * Démarre la synchronisation sortante (PUSH).
     */
    async startPush(url: string, key: string): Promise<void> {
        if (this.isSyncing) return;
        
        const supabase = getSupabaseClient(url, key);
        if (!supabase) return;

        this.isSyncing = true;

        try {
            // 1. Priorité aux suppressions
            const deletions = await db.sync_queue.where('operation').equals('DELETE').toArray();
            for (const item of deletions) {
                const { error } = await supabase
                    .from(this.camelToSnake(item.table))
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('uuid', item.payload.uuid);
                
                if (!error) await db.sync_queue.delete(item.id!);
            }

            // 2. Upsert des nouvelles données et modifications (en lots de 50)
            let hasMore = true;
            while (hasMore) {
                const queueItems = await db.sync_queue.orderBy('id').limit(50).toArray();
                if (queueItems.length === 0) {
                    hasMore = false;
                    break;
                }

                for (const item of queueItems) {
                    const tableName = this.camelToSnake(item.table);
                    const payload = this.sanitizeForCloud(item.payload);

                    const { error } = await supabase
                        .from(tableName)
                        .upsert(payload, { onConflict: 'uuid' });
                    
                    if (!error) {
                        await db.sync_queue.delete(item.id!);
                    } else {
                        console.warn(`[Titanium Sync] Item ${item.id} failed:`, error.message);
                        // Arrêter le lot en cas d'erreur persistante sur un item critique
                        hasMore = false;
                        break;
                    }
                }
                if (queueItems.length < 50) hasMore = false;
            }

            // 3. Mise à jour de l'horodatage de synchronisation
            const profile = await db.company_profile.toCollection().first();
            if (profile?.id) {
                await db.company_profile.update(profile.id, {
                    lastSyncAt: new Date(),
                    syncStatus: 'synced'
                });
            }
        } catch (e) {
            console.error('[Titanium Sync] Critical Failure:', e);
        } finally {
            this.isSyncing = false;
        }
    }

    private camelToSnake(str: string): string {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    private sanitizeForCloud(data: any): any {
        if (!data) return data;
        const clean: any = {};
        for (const key in data) {
            if (key === 'id') continue; // L'ID local n'est pas envoyé au Cloud
            let value = data[key];
            if (value instanceof Date) value = value.toISOString();
            clean[this.camelToSnake(key)] = value;
        }
        return clean;
    }
}

export const syncService = new SyncService();