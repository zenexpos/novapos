
'use client';

import { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Database, 
    Loader2,
    RotateCcw,
    AlertTriangle,
    ShieldAlert,
    Save
} from 'lucide-react';
import { backupService } from '@/services/backup.service';
import { toast } from 'sonner';

interface BackupPreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    payload: any;
}

/**
 * Dialogue d'aperçu pour la RESTAURATION TOTALE.
 * Affiche un résumé des entités et des paramètres système qui vont remplacer l'état actuel.
 */
export function BackupPreviewDialog({ isOpen, onOpenChange, payload }: BackupPreviewDialogProps) {
    const [isRestoring, setIsRestoring] = useState(false);
    const [confirmReplacement, setConfirmReplacement] = useState(false);

    const stats = useMemo(() => {
        if (!payload || !payload.db) return [];
        return Object.entries(payload.db).map(([tableName, records]: [string, any]) => ({
            name: tableName,
            count: records.length
        })).filter(s => s.count > 0);
    }, [payload]);

    const handleRestore = async () => {
        if (!confirmReplacement) {
            setConfirmReplacement(true);
            return;
        }

        setIsRestoring(true);
        try {
            await backupService.restoreBackup(payload);
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Échec de la restauration", { description: error.message });
            setIsRestoring(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-2xl bg-card p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground">
                            <Database className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight uppercase">Restauration Totale Elite</DialogTitle>
                            <DialogDescription className="text-xs font-bold uppercase text-primary/40">Analyse du manifeste iPOS Zen</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                        <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-amber-700 uppercase">Attention Remplacement</p>
                            <p className="text-xs text-amber-600/80 leading-relaxed">
                                Cette action va <span className="font-black underline">écraser intégralement</span> votre base de données locale actuelle ainsi que vos réglages par le contenu de ce fichier.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 ml-1 tracking-widest">Contenu du manifeste</p>
                        <ScrollArea className="h-48 rounded-2xl border border-white/5 bg-black/20 p-4">
                            <div className="space-y-2">
                                {stats.map(s => (
                                    <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-card/40 border border-white/5">
                                        <span className="text-xs font-bold uppercase opacity-60">{s.name.replace('_', ' ')}</span>
                                        <span className="font-mono font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {confirmReplacement && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl animate-in zoom-in-95 flex items-center gap-4">
                            <ShieldAlert className="h-6 w-6 text-destructive animate-pulse" />
                            <p className="text-[10px] font-black text-destructive uppercase leading-tight">
                                Confirmez-vous la perte définitive des données locales actuelles ?
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 bg-muted/10 border-t border-white/5 flex gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold flex-1" disabled={isRestoring}>
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleRestore} 
                        variant={confirmReplacement ? "destructive" : "default"}
                        disabled={isRestoring} 
                        className="rounded-xl h-12 font-black text-xs uppercase tracking-widest flex-[2] shadow-xl transition-all active:scale-95 gap-3"
                    >
                        {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmReplacement ? <RotateCcw className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        {isRestoring ? 'Injection...' : confirmReplacement ? 'OUI, ÉCRASER TOUT' : 'Vérifier & Restaurer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
