'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * محرك المزامنة Titanium Sync - المسؤول عن نقل البيانات بين IndexedDB و Supabase.
 */
class SyncService {
    private isSyncing = false;

    async startSync(url: string, key: string): Promise<void> {
        if (this.isSyncing) return;
        this.isSyncing = true;

        const supabase = getSupabaseClient(url, key);
        if (!supabase) {
            this.isSyncing = false;
            return;
        }

        try {
            // 1. معالجة طابور المزامنة (Local to Cloud)
            const queueItems = await db.sync_queue.orderBy('id').toArray();
            for (const item of queueItems) {
                const { error } = await supabase
                    .from(item.table)
                    .upsert(item.payload, { onConflict: 'uuid' });
                
                if (!error) await db.sync_queue.delete(item.id!);
            }

            // 2. تحديث طابع المزامنة في الملف الشخصي
            const profile = await db.company_profile.toCollection().first();
            if (profile?.id) {
                await db.company_profile.update(profile.id, {
                    last_sync_at: new Date(),
                    syncStatus: 'synced'
                });
            }
        } catch (e) {
            console.error('[Sync Engine] Error:', e);
        } finally {
            this.isSyncing = false;
        }
    }
}

export const syncService = new SyncService();
