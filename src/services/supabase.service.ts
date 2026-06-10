'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';
import type { SyncStatus } from '@/lib/types';

/**
 * Service de synchronisation TITANIUM OFFLINE.
 * Gère le transfert bidirectionnel intelligent entre IndexedDB et Supabase.
 * Architecture local-first : le succès local est immédiat, le cloud est asynchrone.
 */
class SupabaseSyncService {

    private isSyncing = false;

    // Ordre de synchronisation pour respecter les contraintes d'intégrité (FK)
    private readonly tableSyncOrder = [
        { name: 'company_profile',   table: db.company_profile },
        { name: 'suppliers',         table: db.suppliers },
        { name: 'customers',         table: db.customers },
        { name: 'products',          table: db.products },
        { name: 'expenses',          table: db.expenses },
        { name: 'stock_intakes',     table: db.stock_intakes },
        { name: 'sales',             table: db.sales },
        { name: 'product_returns',   table: db.product_returns },
        { name: 'payments',          table: db.payments },
        { name: 'bread_orders',      table: db.bread_orders },
        { name: 'inventory_logs',    table: db.inventory_logs },
        { name: 'supplier_payments', table: db.supplier_payments },
        { name: 'proforma_invoices', table: db.proforma_invoices },
    ];

    /**
     * Teste la connexion au Cloud Saphir.
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
     * Synchronisation Intelligente (Pull → Merge → Push).
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
            // 1. PULL & MERGE ( جلب التحديثات من السحاب )
            await this.pullAndMerge(supabase);

            // 2. PUSH ( رفع العمليات المحلية المعلقة )
            await this.pushPendingOperations(supabase);
            
            // 3. Update Last Sync Date in Profile
            const profile = await db.company_profile.toCollection().first();
            if (profile?.id) {
                await db.company_profile.update(profile.id, {
                    last_sync_at: new Date(),
                    syncStatus: 'synced'
                });
            }
        } finally {
            this.isSyncing = false;
        }
    }

    private async pullAndMerge(supabase: any): Promise<void> {
        for (const item of this.tableSyncOrder) {
            const { data: remoteRecords, error } = await supabase
                .from(item.name)
                .select('*')
                .order('updated_at', { ascending: false });

            if (error || !remoteRecords) continue;

            await db.transaction('rw', item.table, async () => {
                for (const remote of remoteRecords) {
                    const local = await item.table.where('uuid').equals(remote.uuid).first();
                    const sanitizedRemote = this.mapToLocal(remote);

                    if (!local) {
                        // Nouveau record depuis le Cloud
                        await item.table.add({ ...sanitizedRemote, syncStatus: 'synced' });
                    } else {
                        // Conflit : Last Updated Wins
                        const localUpdate = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
                        const remoteUpdate = sanitizedRemote.updatedAt ? sanitizedRemote.updatedAt.getTime() : 0;

                        if (remoteUpdate > localUpdate) {
                            await item.table.update(local.id!, { ...sanitizedRemote, syncStatus: 'synced' });
                        }
                    }
                }
            });
        }
    }

    private async pushPendingOperations(supabase: any): Promise<void> {
        for (const item of this.tableSyncOrder) {
            // Identifier les records locaux non synchronisés
            const pending = await item.table.where('syncStatus').equals('pending').toArray();
            if (pending.length === 0) continue;

            const dataToPush = pending.map(p => this.sanitizeForCloud(p));

            const { error } = await supabase
                .from(item.name)
                .upsert(dataToPush, { onConflict: 'uuid' });

            if (!error) {
                // Marquer comme synchronisé
                await db.transaction('rw', item.table, async () => {
                    for (const record of pending) {
                        if (record.id) {
                            await item.table.update(record.id, { syncStatus: 'synced' });
                        }
                    }
                });
            }
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
            if (key === 'id') continue; // ID local auto-increment non nécessaire sur Cloud
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
            // Conversion dates
            if (typeof value === 'string' && (key.endsWith('_at') || key.endsWith('_date'))) {
                const d = new Date(value);
                if (!isNaN(d.getTime())) value = d;
            }
            clean[camelKey] = value;
        }
        return clean;
    }
    
    async pull(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (supabase) await this.pullAndMerge(supabase);
    }

    async push(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (supabase) await this.pushPendingOperations(supabase);
    }
}

export const supabaseSyncService = new SupabaseSyncService();
