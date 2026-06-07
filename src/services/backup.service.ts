'use client';

import { db, DB_VERSION } from '@/lib/db';
import { toast } from 'sonner';

/**
 * @fileOverview Service de gestion des archives et de la souveraineté des données.
 * Système de restauration "Total State" : remplace intégralement l'état actuel par le contenu du manifeste.
 */
class BackupService {

    private async exportData(): Promise<Record<string, any[]>> {
        const data: Record<string, any[]> = {};
        // Exportation de toutes les tables enregistrées dans Dexie
        for (const table of db.tables) {
            data[table.name] = await table.toArray();
        }
        return data;
    }

    /**
     * Génère un fichier de sauvegarde JSON complet.
     */
    async createBackup(): Promise<File> {
        try {
            const tableData = await this.exportData();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `ipos-zen-full-backup-${timestamp}.json`;

            const backupPayload = {
                _meta: {
                    schemaVersion: DB_VERSION,
                    exportedAt:    new Date().toISOString(),
                    appName:       'iPOS Zen',
                    isFullBackup:  true
                },
                ...tableData,
            };

            return new File(
                [JSON.stringify(backupPayload, null, 2)],
                fileName,
                { type: 'application/json' }
            );
        } catch (error) {
            console.error('Backup creation failed:', error);
            throw new Error('La génération de la sauvegarde a échoué.');
        }
    }

    /**
     * Valide un manifeste avant injection.
     */
    async validateAndParseBackup(file: File): Promise<Record<string, any[]>> {
        try {
            const text = await file.text();
            const raw = JSON.parse(text);
            const { _meta, ...tableData } = raw;

            if (_meta?.schemaVersion && Number(_meta.schemaVersion) > DB_VERSION) {
                throw new Error(`Version incompatible (v${_meta.schemaVersion}). Veuillez mettre à jour l'application.`);
            }

            const data: Record<string, any[]> = {};
            db.tables.forEach(table => {
                data[table.name] = Array.isArray(tableData[table.name]) ? tableData[table.name] : [];
            });

            return data;
        } catch (error: any) {
            throw new Error('Fichier invalide : ' + error.message);
        }
    }

    /**
     * Restauration TOTALE : Vide toutes les tables et injecte les nouvelles données.
     * Cette opération rend l'application identique à l'état de la sauvegarde.
     */
    async restoreBackup(data: Record<string, any[]>): Promise<void> {
        const allTables = db.tables;
        
        try {
            // Utilisation d'une transaction globale sur TOUTES les tables pour garantir l'atomicité
            await db.transaction('rw', allTables, async () => {
                for (const table of allTables) {
                    await table.clear(); // Purge totale avant injection
                    
                    const records = data[table.name];
                    if (records && records.length > 0) {
                        // On retire les IDs locaux pour laisser Dexie les réattribuer si nécessaire, 
                        // tout en conservant les UUID pour la synchronisation.
                        const cleanRecords = records.map(({ id, ...rest }) => rest);
                        await table.bulkAdd(cleanRecords);
                    }
                }
            });
            toast.success("Restauration complète réussie. Le système est à jour.");
        } catch (error: any) {
            console.error('Critical Restore Failure:', error);
            throw new Error("Échec de la restauration totale : " + error.message);
        }
    }
}

export const backupService = new BackupService();
