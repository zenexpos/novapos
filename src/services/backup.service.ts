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
        // Exportation de toutes les tables enregistrées dans Dexie pour une sauvegarde TOTALE
        for (const table of db.tables) {
            data[table.name] = await table.toArray();
        }
        return data;
    }

    /**
     * Génère un fichier de sauvegarde JSON complet incluant TOUTES les données.
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
                // On s'assure que même si une table est absente du fichier, on la traite (vide)
                data[table.name] = Array.isArray(tableData[table.name]) ? tableData[table.name] : [];
            });

            return data;
        } catch (error: any) {
            throw new Error('Fichier invalide : ' + error.message);
        }
    }

    /**
     * Restaurer TOUT le système : purge totale puis injection.
     * Cette méthode garantit que l'app revient exactement à l'état du fichier.
     */
    async restoreBackup(data: Record<string, any[]>): Promise<void> {
        const allTables = db.tables;
        
        try {
            // Transaction globale atomique sur TOUTES les tables
            await db.transaction('rw', allTables, async () => {
                for (const table of allTables) {
                    // 1. Purge totale du contenu local pour cette table
                    await table.clear(); 
                    
                    const records = data[table.name];
                    if (records && records.length > 0) {
                        // 2. Nettoyage des IDs locaux pour éviter les conflits et forcer la ré-indexation
                        // Tout en préservant les UUIDs qui sont les clés de synchronisation cloud.
                        const cleanRecords = records.map(({ id, ...rest }) => rest);
                        await table.bulkAdd(cleanRecords);
                    }
                }
            });
            
            toast.success("Système restauré intégralement.");
        } catch (error: any) {
            console.error('Critical Restore Failure:', error);
            throw new Error("Échec de la restauration totale : " + error.message);
        }
    }
}

export const backupService = new BackupService();
