'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Download, Smartphone, Monitor, Laptop, Globe,
    CheckCircle2, AlertCircle, Wifi, WifiOff,
    Share2, PlusSquare, Zap, LayoutGrid, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_VERSION } from '@/lib/constants';

type Platform = 'android' | 'ios' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/Macintosh|Windows|Linux/.test(ua)) return 'desktop';
    return 'unknown';
}

const steps = {
    ios: [
        { icon: Share2,     label: 'Appuyez sur le bouton Partager',          desc: 'En bas de Safari' },
        { icon: PlusSquare, label: 'Sélectionnez "Sur l\'écran d\'accueil"', desc: 'Faites défiler les options' },
        { icon: CheckCircle2, label: 'Appuyez sur "Ajouter"',                  desc: 'L\'application est installée' },
    ],
    android: [
        { icon: Globe,        label: 'Ouvrez Chrome',                    desc: 'Naviguez vers cette page' },
        { icon: PlusSquare,   label: 'Menu ⋮ → "Installer l\'appli"',   desc: 'Ou la bannière d\'installation' },
        { icon: CheckCircle2, label: 'Confirmez l\'installation',         desc: 'iPOS apparaît sur votre écran' },
    ],
    desktop: [
        { icon: PlusSquare,   label: 'Cliquez sur l\'icône d\'installation', desc: 'Située dans la barre d\'adresse (⊕)' },
        { icon: Laptop,       label: 'Confirmez l\'installation',          desc: 'iPOS s\'ouvrira dans une fenêtre dédiée' },
        { icon: CheckCircle2, label: 'Épinglez à la barre des tâches',     desc: 'Pour un accès instantané' },
    ],
    unknown: [
        { icon: Globe,        label: 'Ouvrez dans un navigateur moderne', desc: 'Chrome, Edge, Safari' },
        { icon: CheckCircle2, label: 'Suivez les instructions d\'installation', desc: 'Selon votre appareil' },
    ],
} as const;

export default function InstallPage() {
    const [platform, setPlatform] = useState<Platform>('unknown');
    const [isOnline, setIsOnline]  = useState(true);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        setPlatform(detectPlatform());
        setIsOnline(navigator.onLine);
        setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
        
        const online  = () => setIsOnline(true);
        const offline = () => setIsOnline(false);
        window.addEventListener('online', online);
        window.addEventListener('offline', offline);
        return () => { 
            window.removeEventListener('online', online); 
            window.removeEventListener('offline', offline); 
        };
    }, []);

    const platformSteps = steps[platform] ?? steps.unknown;

    return (
        <div className="p-6 sm:p-4 space-y-6 max-w-4xl mx-auto pb-32 animate-in fade-in duration-1000">
            <PageHeader
                title="Installation Desktop & PWA"
                description={`v${APP_VERSION} — Convertissez iPOS Zen en application native`}
                icon={Download}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
                    <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                {platform === 'desktop' ? <Monitor className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">
                                    Guide : {
                                        platform === 'ios'     ? 'Apple iOS' :
                                        platform === 'android' ? 'Android OS' :
                                        platform === 'desktop' ? 'Windows / macOS' : 'Votre Appareil'
                                    }
                                </CardTitle>
                                <p className="text-[10px] font-bold uppercase text-primary/40 tracking-widest mt-1">Protocole d'installation Elite</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                        {platformSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-6 group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                        <step.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    {i < platformSteps.length - 1 && <div className="w-0.5 h-12 bg-white/5" />}
                                </div>
                                <div className="pt-2">
                                    <h4 className="text-base font-black tracking-tight text-foreground">{step.label}</h4>
                                    <p className="text-xs font-medium text-muted-foreground/60 mt-1 uppercase tracking-wide">{step.desc}</p>
                                </div>
                                <div className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-[10px] font-black text-primary border border-primary/20">
                                    {i + 1}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="rounded-lg border-white/5 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                        <CardHeader className="p-4 border-b border-white/5 bg-muted/20">
                            <CardTitle className="text-[10px] font-bold uppercase opacity-40">Statut du Système</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    {isOnline ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-destructive" />}
                                    <span className="text-[10px] font-bold uppercase opacity-60">Réseau</span>
                                </div>
                                <span className={cn("text-[10px] font-black uppercase", isOnline ? "text-emerald-500" : "text-destructive")}>
                                    {isOnline ? "En Ligne" : "Offline"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    {isInstalled ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                                    <span className="text-[10px] font-bold uppercase opacity-60">Installation</span>
                                </div>
                                <span className={cn("text-[10px] font-black uppercase", isInstalled ? "text-emerald-500" : "text-amber-500")}>
                                    {isInstalled ? "Active" : "Requise"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg border-primary/20 bg-primary/5 shadow-xl overflow-hidden group">
                        <CardHeader className="p-6 pb-2">
                            <Zap className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                            <CardTitle className="text-lg font-black tracking-tight">Vitesse & Souveraineté</CardTitle>
                            <p className="text-xs font-medium text-muted-foreground/60 leading-relaxed mt-2">
                                L'installation permet un démarrage instantané sans navigateur et garantit la confidentialité totale de vos données locales.
                            </p>
                        </CardHeader>
                        <CardContent className="p-6 pt-4">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: LayoutGrid, label: "Bureau" },
                                    { icon: WifiOff, label: "Offline" },
                                    { icon: Zap, label: "Instant" },
                                    { icon: CheckCircle2, label: "Local" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-black/20 border border-white/5">
                                        <item.icon className="h-3 w-3 text-primary/40" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
