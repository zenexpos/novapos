
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

    private getLocalStorageData(): Record<string, string | null> {
        const keys = ['ipos-app-store', 'ipos-cart-store', 'ipos-theme', 'ipos-autoprint-enabled'];
        const data: Record<string, string | null> = {};
        keys.forEach(k => {
            data[k] = localStorage.getItem(k);
        });
        return data;
    }

    /**
     * Génère un fichier de sauvegarde JSON complet incluant TOUTES les données.
     */
    async createBackup(): Promise<File> {
        try {
            const tableData = await this.exportData();
            const storageData = this.getLocalStorageData();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `ipos-zen-full-backup-${timestamp}.json`;

            const backupPayload = {
                _meta: {
                    schemaVersion: DB_VERSION,
                    exportedAt:    new Date().toISOString(),
                    appName:       'iPOS Zen',
                    isFullBackup:  true
                },
                db: tableData,
                storage: storageData
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
    async validateAndParseBackup(file: File): Promise<any> {
        try {
            const text = await file.text();
            const raw = JSON.parse(text);
            
            if (!raw.db || !raw._meta) {
                throw new Error("Le fichier ne semble pas être un manifeste iPOS Zen valide.");
            }

            if (raw._meta?.schemaVersion && Number(raw._meta.schemaVersion) > DB_VERSION) {
                throw new Error(`Version incompatible (v${raw._meta.schemaVersion}). Veuillez mettre à jour l'application.`);
            }

            return raw;
        } catch (error: any) {
            throw new Error('Fichier invalide : ' + error.message);
        }
    }

    /**
     * Restaurer TOUT le système : purge totale puis injection.
     * Cette méthode garantit que l'app revient exactement à l'état du fichier.
     */
    async restoreBackup(payload: any): Promise<void> {
        const allTables = db.tables;
        const data = payload.db;
        const storage = payload.storage;
        
        try {
            // 1. Transaction globale atomique sur TOUTES les tables Dexie
            await db.transaction('rw', allTables, async () => {
                for (const table of allTables) {
                    await table.clear(); 
                    const records = data[table.name];
                    if (records && records.length > 0) {
                        // Nettoyage des IDs pour ré-indexation propre
                        const cleanRecords = records.map(({ id, ...rest }: any) => rest);
                        await table.bulkAdd(cleanRecords);
                    }
                }
            });

            // 2. Restauration des états Zustand et préférences UI
            if (storage) {
                Object.entries(storage).forEach(([key, value]) => {
                    if (value) localStorage.setItem(key, value as string);
                });
            }
            
            toast.success("Système restauré intégralement.");
            
            // Rechargement obligatoire pour réinitialiser les stores en mémoire
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: any) {
            console.error('Critical Restore Failure:', error);
            throw new Error("Échec de la restauration totale : " + error.message);
        }
    }
}

export const backupService = new BackupService();
