'use client';

import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
            <div className="p-8 rounded-3xl bg-muted/20 border-2 border-dashed border-border mb-8 animate-pulse">
                <WifiOff className="h-20 w-20 text-muted-foreground/30" />
            </div>
            
            <div className="space-y-4 max-w-md">
                <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground">
                    Zone Hors-Ligne
                </h1>
                <p className="text-muted-foreground font-medium leading-relaxed">
                    Il semble que vous soyez déconnecté. iPOS Zen peut fonctionner hors-ligne, mais cette page spécifique n'a pas encore été mise en cache.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                    <Button 
                        size="lg" 
                        className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest gap-2 shadow-xl active:scale-95"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="h-5 w-5" />
                        Réessayer
                    </Button>
                    
                    <Button 
                        variant="outline"
                        size="lg" 
                        className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest gap-2 border-white/5 bg-card"
                        asChild
                    >
                        <Link href="/">
                            <Home className="h-5 w-5" />
                            Tableau de bord
                        </Link>
                    </Button>
                </div>
            </div>
            
            <p className="mt-20 text-[10px] font-black uppercase text-muted-foreground/20 tracking-[0.3em]">
                iPOS Zen Sovereign Ledger • Offline Mode
            </p>
        </div>
    );
}