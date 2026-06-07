'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Download, Smartphone, Monitor, Laptop, Globe,
    CheckCircle2, AlertCircle, Wifi, WifiOff,
    Share2, PlusSquare, Zap,
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
        { icon: Laptop,       label: 'Icône d\'installation dans la barre d\'adresse', desc: 'Cliquez sur le ⊕' },
        { icon: CheckCircle2, label: 'Cliquez sur "Installer"', desc: 'iPOS s\'ouvre comme une app native' },
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
        // Check if already installed as PWA
        setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
        const online  = () => setIsOnline(true);
        const offline = () => setIsOnline(false);
        window.addEventListener('online', online);
        window.addEventListener('offline', offline);
        return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
    }, []);

    const platformSteps = steps[platform] ?? steps.unknown;

    return (
        <div className="p-4 sm:p-5 pb-24 max-w-2xl mx-auto space-y-5 animate-page-enter">
            <PageHeader
                title="Installer iPOS Zen"
                description={`v${APP_VERSION} — Application PWA locale`}
                icon={Download}
            />

            {/* Status cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        {isOnline
                            ? <Wifi className="h-5 w-5 text-emerald-500" />
                            : <WifiOff className="h-5 w-5 text-red-500" />}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
                                Connexion
                            </p>
                            <p className={cn('text-sm font-black', isOnline ? 'text-emerald-500' : 'text-red-500')}>
                                {isOnline ? 'En ligne' : 'Hors ligne'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        {isInstalled
                            ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            : <AlertCircle  className="h-5 w-5 text-amber-500"   />}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
                                Statut
                            </p>
                            <p className={cn('text-sm font-black', isInstalled ? 'text-emerald-500' : 'text-amber-500')}>
                                {isInstalled ? 'Installée' : 'Non installée'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Platform guide */}
            <Card>
                <CardHeader className="px-5 pt-5 pb-4 border-b border-[var(--glass-border)]">
                    <CardTitle className="flex items-center gap-2 text-base font-black gradient-text">
                        {platform === 'ios'     && <Smartphone className="h-5 w-5" />}
                        {platform === 'android' && <Smartphone className="h-5 w-5" />}
                        {platform === 'desktop' && <Monitor    className="h-5 w-5" />}
                        Installation — {
                            platform === 'ios'     ? 'iPhone / iPad' :
                            platform === 'android' ? 'Android'        :
                            platform === 'desktop' ? 'Ordinateur'     : 'Appareil'
                        }
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    {platformSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-4 animate-slide-up"
                            style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20
                                flex items-center justify-center shrink-0">
                                <step.icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 pt-0.5">
                                <p className="text-sm font-black">{step.label}</p>
                                <p className="text-xs text-muted-foreground/50 mt-0.5">{step.desc}</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-black text-primary">
                                {i + 1}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Features */}
            <Card>
                <CardHeader className="px-5 pt-5 pb-4 border-b border-[var(--glass-border)]">
                    <CardTitle className="text-base font-black gradient-text">
                        Avantages de l'installation
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: Zap,          label: 'Démarrage instantané', desc: 'Sans navigateur'   },
                            { icon: WifiOff,      label: 'Mode hors ligne',      desc: 'Fonctionne partout' },
                            { icon: Monitor,      label: 'Plein écran',          desc: 'Comme une app native' },
                            { icon: CheckCircle2, label: 'Données locales',      desc: 'Privacy garantie'   },
                        ].map(f => (
                            <div key={f.label} className="p-3 rounded-xl bg-muted/20 border border-muted/40 space-y-1">
                                <f.icon className="h-4 w-4 text-primary" />
                                <p className="text-xs font-black">{f.label}</p>
                                <p className="text-[10px] text-muted-foreground/40">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
