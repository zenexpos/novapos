'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Moteur de synchronisation Titanium Sync - Responsable du transfert de données entre IndexedDB et Supabase.
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
            // 1. Traitement de la file de synchronisation (Local vers Cloud)
            const queueItems = await db.sync_queue.orderBy('id').toArray();
            for (const item of queueItems) {
                const { error } = await supabase
                    .from(item.table)
                    .upsert(item.payload, { onConflict: 'uuid' });
                
                if (!error) await db.sync_queue.delete(item.id!);
            }

            // 2. Mise à jour de l'horodatage de synchronisation dans le profil
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
