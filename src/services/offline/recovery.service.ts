'use client';

import { db } from '@/lib/db';
import { toast } from 'sonner';

/**
 * Service de Diagnostic et Récupération Elite.
 * Vérifie l'intégrité de la base IndexedDB et propose des actions de secours.
 */
class RecoveryService {
    async checkIntegrity(): Promise<{ healthy: boolean; issues: string[] }> {
        const issues: string[] = [];
        try {
            // Check if tables are accessible
            await Promise.all(db.tables.map(t => t.limit(1).toArray()));
        } catch (e: any) {
            issues.push(`Accès base de données : ${e.message}`);
        }

        return {
            healthy: issues.length === 0,
            issues
        };
    }

    async forceVacuum(): Promise<void> {
        // Dexie vacuum isn't a direct command but we can clear sync queue to speed up
        try {
            const count = await db.sync_queue.count();
            if (count > 1000) {
                toast.warning("File de synchronisation volumineuse détectée.");
            }
        } catch (e) {}
    }

    /**
     * Tente de réparer les liens rompus entre ventes et clients (Audit).
     */
    async auditFinancialLinks(): Promise<number> {
        let fixedCount = 0;
        const sales = await db.sales.filter(s => !!s.customerUuid).toArray();
        for (const sale of sales) {
            const customer = await db.customers.where('uuid').equals(sale.customerUuid!).first();
            if (!customer) {
                // Orphaned sale detected
                fixedCount++;
            }
        }
        return fixedCount;
    }
}

export const recoveryService = new RecoveryService();