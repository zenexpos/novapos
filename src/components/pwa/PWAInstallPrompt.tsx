'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Download, 
    X, 
    Smartphone, 
    Monitor, 
    Share2, 
    PlusSquare, 
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const DISMISS_KEY = 'ipos-pwa-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallPrompt() {
    const [isVisible, setIsOpen] = useState(false);
    const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | 'unknown'>('unknown');
    const deferredPrompt = useRef<any>(null);

    useEffect(() => {
        // Detect platform
        const ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(ua)) setPlatform('ios');
        else if (/Android/.test(ua)) setPlatform('android');
        else if (/Macintosh|Windows|Linux/.test(ua)) setPlatform('desktop');

        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || (navigator as any).standalone === true;
        
        if (isStandalone) return;

        // Check if dismissed recently
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION) return;

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            deferredPrompt.current = e;
            // Delay showing to wait for user engagement
            setTimeout(() => setIsOpen(true), 5000);
        };

        const handleAppInstalled = () => {
            setIsOpen(false);
            deferredPrompt.current = null;
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // For iOS, show prompt manually after engagement since beforeinstallprompt isn't supported
        if (/iPhone|iPad|iPod/.test(ua) && !isStandalone) {
            setTimeout(() => setIsOpen(true), 10000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt.current) return;
        
        deferredPrompt.current.prompt();
        const { outcome } = await deferredPrompt.current.userChoice;
        
        if (outcome === 'accepted') {
            setIsOpen(false);
            deferredPrompt.current = null;
        }
    };

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
        setIsOpen(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-md animate-in slide-in-from-bottom-10 duration-1000">
            <div className="app-card rounded-3xl border-primary/20 bg-card/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-shimmer" />
                
                <button 
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors z-10"
                >
                    <X className="h-4 w-4 opacity-30" />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-lg p-2 flex-shrink-0 group-hover:rotate-3 transition-transform">
                            <Image 
                                src="/icon.svg" 
                                alt="iPOS Zen" 
                                width={40} 
                                height={40} 
                            />
                        </div>
                        <div>
                            <h3 className="font-black text-lg tracking-tight uppercase">iPOS Zen Desktop</h3>
                            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Expérience Native Elite</p>
                        </div>
                    </div>

                    <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8">
                        Installez iPOS Zen sur votre écran d'accueil pour un accès instantané, des performances accrues et une souveraineté totale.
                    </p>

                    {platform === 'ios' ? (
                        <div className="space-y-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-6">
                            <p className="text-[10px] font-black uppercase text-primary mb-2 flex items-center gap-2">
                                <PlusSquare className="h-3 w-3" /> Guide iOS
                            </p>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-xl bg-background shadow-inner">
                                    <Share2 className="h-4 w-4 text-primary" />
                                </div>
                                <p className="text-xs font-bold leading-tight">
                                    1. Appuyez sur le bouton <span className="text-primary">Partager</span> dans Safari
                                </p>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-xl bg-background shadow-inner">
                                    <PlusSquare className="h-4 w-4 text-primary" />
                                </div>
                                <p className="text-xs font-bold leading-tight">
                                    2. Sélectionnez <span className="text-primary">"Sur l'écran d'accueil"</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/20 border border-white/5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Plein Écran</span>
                            </div>
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/20 border border-white/5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Offline Stable</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button 
                            variant="ghost" 
                            onClick={handleDismiss}
                            className="flex-1 h-12 rounded-2xl font-bold text-[10px] uppercase tracking-widest"
                        >
                            Pas maintenant
                        </Button>
                        {platform !== 'ios' && (
                            <Button 
                                onClick={handleInstall}
                                className="flex-[2] h-12 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl gap-2 active:scale-95 transition-all bg-accent text-accent-foreground"
                            >
                                <Download className="h-4 w-4" />
                                Installer
                            </Button>
                        )}
                    </div>
                </div>
                
                <div className="p-3 bg-primary/5 text-center border-t border-white/5">
                    <p className="text-[8px] font-black uppercase text-muted-foreground/30 flex items-center justify-center gap-2">
                        <Sparkles className="h-2.5 w-2.5" /> Sécurisé & Souverain
                    </p>
                </div>
            </div>
        </div>
    );
}