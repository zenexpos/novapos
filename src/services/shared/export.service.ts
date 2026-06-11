'use client';

import Papa from 'papaparse';
import { toast } from 'sonner';

/**
 * Centralized Export Service for iPOS Zen.
 * Handles CSV generation with proper encoding (UTF-8 BOM) for Excel compatibility.
 */
class ExportService {
    exportToCsv(filename: string, data: any[]) {
        if (!data || data.length === 0) {
            toast.error("Aucune donnée à exporter.");
            return;
        }

        try {
            const csv = Papa.unparse(data);
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success("Exportation réussie.");
        } catch (error) {
            console.error('Export error:', error);
            toast.error("Échec de l'exportation.");
        }
    }
}

export const exportService = new ExportService();