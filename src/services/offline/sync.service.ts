'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'sonner';

class SyncService {
    private isSyncing = false;

    async performSync(url: string, key: string): Promise<void> {
        if (this.isSyncing) return;
        this.isSyncing = true;

        const supabase = getSupabaseClient(url, key);
        if (!supabase) {
            this.isSyncing = false;
            return;
        }

        try {
            // 1. Push local changes
            const queueItems = await db.sync_queue.orderBy('id').toArray();
            for (const item of queueItems) {
                const { error } = await supabase
                    .from(this.camelToSnake(item.table))
                    .upsert(this.sanitizePayload(item.payload), { onConflict: 'uuid' });
                
                if (!error) await db.sync_queue.delete(item.id!);
            }

            // 2. Update Sync Timestamp
            const profile = await db.company_profile.toCollection().first();
            if (profile?.id) {
                await db.company_profile.update(profile.id, {
                    last_sync_at: new Date(),
                    syncStatus: 'synced'
                });
            }
        } catch (e) {
            console.error('Sync Engine Error:', e);
        } finally {
            this.isSyncing = false;
        }
    }

    private camelToSnake(str: string) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    private sanitizePayload(data: any) {
        const { id, ...rest } = data;
        const clean: any = {};
        for (const key in rest) {
            const snakeKey = this.camelToSnake(key);
            clean[snakeKey] = rest[key] instanceof Date ? rest[key].toISOString() : rest[key];
        }
        return clean;
    }
}

export const syncService = new SyncService();
