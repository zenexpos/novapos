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

    /**
     * Repairs orphaned sales or inconsistent customer balances.
     */
    async auditAndRepairBalances(): Promise<void> {
        toast.info("Analyse de l'intégrité financière...");
        const customers = await db.customers.toArray();
        const { customerService } = await import('../customer.service');
        
        for (const customer of customers) {
            await customerService.recalculateCustomerStatus(customer.uuid);
        }
        toast.success("Audit financier terminé. Cohérence rétablie.");
    }
}

export const recoveryService = new RecoveryService();
