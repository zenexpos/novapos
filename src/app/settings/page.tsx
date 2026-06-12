'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/layout/PageHeader";
import { DataManagementCard } from "@/components/profile/DataManagementCard";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardFooter, 
    CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
    ShieldAlert, 
    Database, 
    HardDrive, 
    Trash2, 
    Cpu, 
    Activity, 
    Server, 
    Smartphone, 
    Monitor, 
    Globe, 
    ShieldCheck, 
    Zap, 
    Shield, 
    Package, 
    Users2, 
    ShoppingCart, 
    X, 
    Info,
    Cloud,
    RefreshCw,
    UploadCloud,
    DownloadCloud,
    CheckCircle2,
    AlertCircle,
    Printer,
    Download,
    Laptop,
    Sparkles
} from "lucide-react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useAppStore, useAppActions } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabaseSyncService } from '@/services/supabase.service';
import { Switch } from '@/components/ui/switch';
import { usePwaInstall } from '@/hooks/usePwaInstall';

export default function SettingsPage() {
    const [stats, setStats] = useState({
        products: 0,
        customers: 0,
        sales: 0,
        logs: 0
    });
    const [storage, setStorage] = useState<{ used: string, quota: string, percent: number } | null>(null);
    const [envInfo, setEnvInfo] = useState<{ os: string, browser: string } | null>(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
    
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const { isInstallable, install } = usePwaInstall();
    const companyProfile = useAppStore(state => state.companyProfile);
    const syncStatus = useAppStore(state => state.syncStatus);
    
    const isSyncing = syncStatus === 'syncing';
    const { performCloudSync } = useAppActions();

    useEffect(() => {
        setIsMounted(true);
        try { setAutoPrintEnabled(localStorage.getItem('ipos-autoprint-enabled') === 'true'); } catch (_) {}
        const fetchStats = async () => {
            try {
                const [p, c, s, l] = await Promise.all([
                    db.products.count(),
                    db.customers.count(),
                    db.sales.count(),
                    db.inventory_logs.count()
                ]);
                setStats({ products: p, customers: c, sales: s, logs: l });
            } catch (err) {}
        };
        fetchStats();

        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                const used = (estimate.usage || 0) / (1024 * 1024);
                const quota = (estimate.quota || 0) / (1024 * 1024);
                setStorage({
                    used: used.toFixed(2) + ' Mo',
                    quota: (quota / 1024).toFixed(1) + ' Go',
                    percent: Math.round(((estimate.usage || 0) / (estimate.quota || 1)) * 100)
                });
            });
        }

        const ua = window.navigator.userAgent;
        let os = "Système inconnu";
        if (ua.indexOf("Win") !== -1) os = "Windows";
        else if (ua.indexOf("Mac") !== -1) os = "macOS";
        else if (ua.indexOf("Linux") !== -1) os = "Linux";
        else if (ua.indexOf("Android") !== -1) os = "Android";
        else if (ua.indexOf("like Mac") !== -1) os = "iOS";

        let browser = "Navigateur inconnu";
        if (ua.indexOf("Chrome") !== -1) browser = "Chrome / Edge";
        else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
        else if (ua.indexOf("Safari") !== -1) browser = "Safari";

        setEnvInfo({ os, browser });
    }, []);

    const testCloudConnection = async () => {
        if (!companyProfile?.supabaseUrl || !companyProfile?.supabaseKey) {
            toast.error("Veuillez configurer Supabase dans votre profil.");
            return;
        }
        setIsTestingConnection(true);
        try {
            const isValid = await supabaseSyncService.testConnection(companyProfile.supabaseUrl, companyProfile.supabaseKey);
            setConnectionStatus(isValid ? 'success' : 'error');
            if (isValid) toast.success("Connexion au Cloud établie.");
            else toast.error("Échec de connexion au Cloud.");
        } catch (e) {
            setConnectionStatus('error');
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleFullReset = async () => {
        try {
            await db.transaction('rw', db.tables, async () => {
                for (const table of db.tables) {
                    await table.clear();
                }
            });
            toast.success("Application réinitialisée avec succès.");
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            toast.error("Erreur lors de la réinitialisation.");
        }
    };

    if (!isMounted) return null;

    const handleAutoPrintToggle = (checked: boolean) => {
        setAutoPrintEnabled(checked);
        try { localStorage.setItem('ipos-autoprint-enabled', String(checked)); } catch (_) {}
    };

    const isSupabaseConfigured = !!(companyProfile?.supabaseUrl && companyProfile?.supabaseKey);

    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-[1800px] mx-auto pb-32 animate-in fade-in duration-1000">
            <PageHeader 
                title="Configuration"
                description="Maintenance technique, diagnostic système et gestion des données locales."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 space-y-4">
                    {isInstallable && (
                        <Card className="app-card rounded-lg border-primary/20 bg-primary/5 overflow-hidden shadow-xl group animate-in slide-in-from-top-4 duration-1000">
                            <CardHeader className="bg-primary/10 border-b border-primary/10 p-6">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg animate-install">
                                            <Laptop className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black tracking-tight">Mode iPOS Desktop</CardTitle>
                                            <CardDescription className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Une meilleure expérience</CardDescription>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={install}
                                        className="rounded-2xl h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all gap-3"
                                    >
                                        <Download className="h-5 w-5" />
                                        Installer Maintenant
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 relative overflow-hidden">
                                <Sparkles className="absolute -right-8 -bottom-8 h-40 w-40 text-primary/5 rotate-12" />
                                <div className="space-y-4 relative z-10">
                                    <p className="text-sm font-bold text-muted-foreground/80 leading-relaxed">
                                        Transformez iPOS Zen en une application de bureau complète. Accédez au système instantanément depuis la barre des tâches.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {['Lancement Rapide', 'Icône Bureau', 'Plein Écran', 'Hors-ligne Stable'].map((feat, i) => (
                                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20 border border-white/5 text-[9px] font-black uppercase tracking-widest">
                                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> {feat}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
                        <CardHeader className="bg-primary/5 border-b border-white/5 p-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                        <Cloud className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-semibold tracking-tighter">Sauvegarde Cloud</CardTitle>
                                        <CardDescription className="text-[10px] font-semibold uppercase text-primary/50">Infrastructure Saphir (Supabase)</CardDescription>
                                    </div>
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={testCloudConnection}
                                    disabled={!isSupabaseConfigured || isTestingConnection}
                                    className="rounded-xl h-10 px-6 font-semibold text-[10px] uppercase tracking-wide border-primary/20 hover:bg-primary/10 transition-all gap-2"
                                >
                                    {isTestingConnection ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                                    Tester Connexion
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {!isSupabaseConfigured ? (
                                <div className="p-4 bg-amber-500/5 rounded-lg border border-dashed border-amber-500/20 text-center">
                                    <div className="p-4 rounded-full bg-amber-500/10 w-fit mx-auto mb-4">
                                        <AlertCircle className="h-8 w-8 text-amber-600" />
                                    </div>
                                    <p className="text-sm font-bold text-amber-600 mb-2 uppercase tracking-tighter">Configuration Requise</p>
                                    <p className="text-xs text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                                        Lien Cloud non détecté. Veuillez renseigner votre URL et Clé Supabase dans votre profil pour activer les sauvegardes.
                                    </p>
                                    <Button variant="outline" className="rounded-2xl border-amber-500/20 text-amber-600 hover:bg-amber-500/10 h-12 px-8 font-semibold text-[10px] uppercase tracking-wide" asChild>
                                        <a href="/profile">Aller au Profil</a>
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {connectionStatus !== 'idle' && (
                                        <div className={cn(
                                            "p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-300",
                                            connectionStatus === 'success' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                                        )}>
                                            {connectionStatus === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                                                {connectionStatus === 'success' ? "Canal Cloud Opérationnel" : "Erreur de connexion Cloud"}
                                            </span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-4 bg-muted/20 rounded-lg border border-white/5 space-y-6 group hover:bg-muted/30 transition-all relative overflow-hidden">
                                            <UploadCloud className="absolute -right-4 -top-4 h-24 w-24 opacity-[0.02] group-hover:opacity-10 transition-opacity" />
                                            <div className="flex items-center gap-3 text-primary relative z-10">
                                                <div className="p-2.5 rounded-xl bg-primary/10 shadow-inner">
                                                    <UploadCloud className="h-5 w-5" />
                                                </div>
                                                <span className="text-[10px] font-semibold uppercase ">Sauvegarde (Envoyer)</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                                                Envoie vos données locales vers le Cloud. Écrase les anciennes versions.
                                            </p>
                                            <Button 
                                                onClick={() => performCloudSync('push')} 
                                                disabled={isSyncing}
                                                className="w-full rounded-2xl h-9 font-semibold text-[10px] uppercase tracking-wide shadow-xl transition-all active:scale-95 gap-3"
                                            >
                                                {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Zap className="h-4 w-4" />}
                                                Déclencher Sauvegarde
                                            </Button>
                                        </div>

                                        <div className="p-4 bg-muted/20 rounded-lg border border-white/5 space-y-6 group hover:bg-muted/30 transition-all relative overflow-hidden">
                                            <DownloadCloud className="absolute -right-4 -top-4 h-24 w-24 opacity-[0.02] group-hover:opacity-10 transition-opacity" />
                                            <div className="flex items-center gap-3 text-emerald-500">
                                                <div className="p-2.5 rounded-xl bg-emerald-500/10 shadow-inner">
                                                    <DownloadCloud className="h-5 w-5" />
                                                </div>
                                                <span className="text-[10px] font-semibold uppercase ">Restauration (Recevoir)</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                                                Récupère vos données depuis le Cloud pour synchroniser cet appareil.
                                            </p>
                                            <Button 
                                                onClick={() => performCloudSync('pull')} 
                                                variant="outline"
                                                disabled={isSyncing}
                                                className="w-full rounded-2xl h-9 font-semibold text-[10px] uppercase tracking-wide border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 transition-all active:scale-95 gap-3"
                                            >
                                                {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin"/> : <DownloadCloud className="h-4 w-4" />}
                                                Restaurer Données
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {companyProfile?.lastSyncAt && (
                                <div className="flex items-center justify-center gap-3 px-6 py-3 bg-primary/5 rounded-2xl border border-primary/10 w-fit mx-auto">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                                        Dernière mise à jour Cloud : {format(new Date(companyProfile.lastSyncAt), 'd MMMM yyyy, HH:mm', { locale: fr })}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="app-card rounded-lg overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-border p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                                    <Printer className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">Impression Automatique</CardTitle>
                                    <CardDescription className="text-xs">Imprime le ticket après chaque vente</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Impression directe</p>
                                    <p className="text-xs text-muted-foreground">Imprime sur imprimante thermique 80mm sans confirmation</p>
                                </div>
                                <Switch
                                    checked={autoPrintEnabled}
                                    onCheckedChange={handleAutoPrintToggle}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                    <Database className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-semibold tracking-tighter">Santé du Système Local</CardTitle>
                                    <CardDescription className="text-[10px] font-semibold uppercase text-primary/50">Analyse du stockage sur cet appareil</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {[
                                    { label: 'Produits', value: stats.products, icon: Package },
                                    { label: 'Clients', value: stats.customers, icon: Users2 },
                                    { label: 'Ventes', value: stats.sales, icon: ShoppingCart },
                                    { label: 'Audit', value: stats.logs, icon: Activity }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-6 rounded-lg bg-black/20 border border-white/5 text-center transition-all hover:scale-105 group">
                                        <p className="text-[9px] font-semibold uppercase text-muted-foreground/40 mb-3 group-hover:text-primary transition-colors">{item.label}</p>
                                        <p className="text-xl font-semibold tracking-tighter">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {storage && (
                                <div className="p-4 rounded-lg bg-muted/10 border border-white/5 space-y-4 relative overflow-hidden group">
                                    <div className="absolute -right-10 -bottom-10 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                                        <HardDrive className="h-48 w-48" />
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-primary">
                                                <Activity className="h-3.5 w-3.5 animate-pulse" /> Espace utilisé
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium italic">Occupation sur le disque local.</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-semibold text-primary">{storage.used}</span>
                                            <span className="text-xs text-muted-foreground mx-3 font-semibold opacity-20">/</span>
                                            <span className="text-sm text-muted-foreground font-semibold opacity-40">{storage.quota}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 relative z-10">
                                        <Progress value={storage.percent} className="h-2.5 bg-muted/20 [&>div]:bg-primary shadow-inner rounded-full" />
                                        <div className="flex justify-between text-[9px] font-semibold uppercase text-muted-foreground/30">
                                            <span>Utilisation: {storage.percent}%</span>
                                            <span>Capacité Maximale</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-4 p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 text-emerald-500">
                                <div className="p-3 rounded-2xl bg-emerald-500/10 shadow-inner">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-semibold uppercase ">Base de données opérationnelle</p>
                                    <p className="text-[9px] font-bold opacity-60 uppercase tracking-wide">Mode 100% Hors-ligne & Confidentialité Totale</p>
                                </div>
                                <Zap className="h-5 w-5 ml-auto opacity-20 animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
                        <DataManagementCard />
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-4 animate-in slide-in-from-right-4 duration-700 delay-300">
                    <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
                        <CardHeader className="p-4 pb-4 border-b border-white/5 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <Server className="h-4 w-4 text-primary opacity-50" />
                                <CardTitle className="text-[10px] font-semibold uppercase text-muted-foreground/60">Environnement</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {[
                                { icon: Monitor, label: 'Système', value: envInfo?.os },
                                { icon: Globe, label: 'Navigateur', value: envInfo?.browser },
                                { icon: Smartphone, label: 'Mode Appli', value: 'ACTIF', status: 'ACTIF' }
                            ].map((env, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <env.icon className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        <span className="text-[10px] font-semibold uppercase tracking-tight opacity-40">{env.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-semibold text-primary uppercase">{env.value || '...'}</span>
                                        {env.status && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
                        <CardHeader className="p-4 pb-4">
                            <div className="flex items-center gap-3">
                                <Info className="h-4 w-4 text-primary opacity-50" />
                                <CardTitle className="text-[10px] font-semibold uppercase text-muted-foreground/60">À propos d'iPOS Zen</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                            <div className="flex items-center gap-5 p-6 bg-primary/5 rounded-lg border border-primary/10 group">
                                <div className="h-9 w-14 rounded-2xl bg-background flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                    <Cpu className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold tracking-tighter">iPOS Zen</p>
                                    <p className="text-[9px] font-semibold text-primary/40 uppercase ">Version 2.0.0 - Stable</p>
                                </div>
                            </div>
                            
                            <div className="space-y-5 text-[11px] font-medium text-muted-foreground/60 leading-relaxed italic px-2">
                                <p>iPOS est une application moderne. Vos données commerciales restent sur votre appareil par défaut.</p>
                                <p>L'utilisation de Supabase permet une sauvegarde optionnelle et sécurisée.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 pb-10 px-4">
                            <div className="w-full flex flex-col items-center gap-4">
                                <div className="w-full h-px bg-white/5" />
                                <div className="flex items-center justify-between w-full text-[10px] font-semibold uppercase opacity-20">
                                    <span className="flex items-center gap-2"><Shield className="h-3 w-3" /> Sécurité</span>
                                    <span className="text-emerald-500">Sauvegarde active</span>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>

                    <Card className="rounded-lg border-destructive/20 bg-destructive/5 overflow-hidden group">
                        <CardHeader className="p-6 bg-destructive/10 border-b border-destructive/10">
                            <div className="flex items-center gap-3 text-destructive">
                                <ShieldAlert className="h-4 w-4 animate-pulse" />
                                <CardTitle className="text-[10px] font-semibold uppercase ">Zone de Danger</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            <p className="text-[10px] font-bold text-destructive/60 leading-relaxed text-center italic px-2 uppercase tracking-wide">
                                Ces actions sont irréversibles et entraînent la perte de vos données locales.
                            </p>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsResetConfirmOpen(true)}
                                className="w-full rounded-2xl h-9 border-destructive/30 bg-background/50 text-destructive hover:bg-destructive hover:text-white transition-all duration-500 font-semibold text-[10px] uppercase gap-3 shadow-xl"
                            >
                                <Trash2 className="h-4 w-4" />
                                Réinitialiser l'Application
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmAlertDialog
                isOpen={isResetConfirmOpen}
                onOpenChange={setIsResetConfirmOpen}
                title="Tout supprimer ?"
                description={
                    <div className="space-y-6">
                        <p className="font-medium text-foreground">Cette action va effacer toutes vos données locales :</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                'Liste des Produits', 'Clients', 
                                'Ventes', 'Historique', 
                                'Profil', 'Stock'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-white/5">
                                    <X className="h-3 w-3 text-destructive opacity-40" />
                                    <span className="text-[10px] font-semibold uppercase tracking-tight opacity-60">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-5 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-4 mt-4">
                            <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-destructive uppercase tracking-tight leading-tight">Attention</p>
                                <p className="text-[10px] text-destructive/70 leading-relaxed font-medium">Vous ne pourrez pas revenir en arrière sans une sauvegarde préalable.</p>
                            </div>
                        </div>
                    </div>
                }
                onConfirm={handleFullReset}
                confirmText="Oui, TOUT supprimer"
            />
        </div>
    );
}
