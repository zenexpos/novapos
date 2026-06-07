'use client';

import { db, DB_VERSION } from '@/lib/db';
import { toast } from 'sonner';

/**
 * Service de gestion des archives et de la souveraineté des données.
 * FIX: Backup includes _meta block with schemaVersion for safe restore validation.
 */
class BackupService {

    private async exportData(): Promise<Record<string, any[]>> {
        const data: Record<string, any[]> = {};
        for (const table of db.tables) {
            data[table.name] = await table.toArray();
        }
        return data;
    }

    /**
     * Génère un fichier de sauvegarde JSON avec métadonnées de version.
     * FIX: Inclut _meta.schemaVersion pour valider la compatibilité lors de la restauration.
     */
    async createBackup(): Promise<File> {
        try {
            const tableData = await this.exportData();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `ipos-backup-${timestamp}.json`;

            // FIX: Add metadata block — schemaVersion used to detect version mismatch on restore
            const backupPayload = {
                _meta: {
                    schemaVersion: DB_VERSION,
                    exportedAt:    new Date().toISOString(),
                    appName:       'iPOS Zen',
                },
                ...tableData,
            };

            const file = new File(
                [JSON.stringify(backupPayload, null, 2)],
                fileName,
                { type: 'application/json' }
            );
            return file;
        } catch (error) {
            console.error('Backup creation failed:', error);
            throw new Error('La compression des archives a échoué.');
        }
    }

    /**
     * Valide et analyse une archive avant aperçu.
     * FIX: Vérifie que schemaVersion de la sauvegarde ≤ version actuelle.
     */
    async validateAndParseBackup(file: File): Promise<Record<string, any[]>> {
        try {
            const text = await file.text();
            const raw = JSON.parse(text);

            // FIX: Extract _meta and validate schema version
            const { _meta, ...tableData } = raw;

            if (_meta?.schemaVersion !== undefined) {
                const backupVersion = Number(_meta.schemaVersion);
                if (backupVersion > DB_VERSION) {
                    throw new Error(
                        `Cette sauvegarde (v${backupVersion}) est plus récente que l'application (v${DB_VERSION}). Mettez à jour iPOS Zen avant de restaurer.`
                    );
                }
            }
            // Legacy backups (no _meta) are accepted without version check

            // Ensure all known tables are present (even as empty arrays)
            const data: Record<string, any[]> = {};
            const allTableNames = db.tables.map(t => t.name);
            allTableNames.forEach(tableName => {
                data[tableName] = Array.isArray(tableData[tableName])
                    ? tableData[tableName]
                    : [];
            });

            return data;
        } catch (error: any) {
            throw new Error('Manifeste corrompu ou invalide : ' + error.message);
        }
    }

    /**
     * Restaure les données sélectionnées dans IndexedDB.
     * FIX: Opération complète dans une transaction — si un table échoue,
     * toutes les tables déjà vidées sont restaurées (Dexie rollback).
     */
    async restoreBackup(data: Record<string, any[]>): Promise<void> {
        try {
            const availableTables = new Set(db.tables.map(t => t.name));
            const tablesToRestore = Object.keys(data).filter(t => availableTables.has(t));

            if (tablesToRestore.length === 0) return;

            const dexieTables = tablesToRestore.map(t => db.table(t));

            await db.transaction('rw', dexieTables, async () => {
                for (const tableName of tablesToRestore) {
                    const table = db.table(tableName);
                    const records = data[tableName];

                    if (records && Array.isArray(records)) {
                        await table.clear();
                        // Strip local auto-increment ids — Dexie will reassign
                        const cleanData = records.map(({ id, ...rest }) => rest);
                        if (cleanData.length > 0) {
                            await table.bulkAdd(cleanData);
                        }
                    }
                }
            });

            toast.success('Restauration sélective terminée.');
        } catch (error: any) {
            console.error('Restore failed:', error);
            throw new Error('Échec critique de la restauration : ' + error.message);
        }
    }
}

export const backupService = new BackupService();
