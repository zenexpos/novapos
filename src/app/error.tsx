'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TriangleAlert, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * Gestionnaire d'erreurs au niveau segment de page.
 * Empêche l'effondrement total du système et protège la session active.
 */
export default function DomainError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[iPOS Zen Domain Error]:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
            <div className="p-8 rounded-3xl bg-destructive/10 border border-destructive/20 mb-8">
                <TriangleAlert className="h-16 w-16 text-destructive" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground mb-2">Erreur de Module</h1>
            <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8 leading-relaxed">
                Le module actuel a rencontré une difficulté. Vos données ne sont pas affectées.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => reset()} 
                    className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest gap-2"
                >
                    <RefreshCcw className="h-5 w-5" />
                    Réessayer le chargement
                </Button>
                <Button asChild size="lg" className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest gap-2">
                    <Link href="/">
                        <Home className="h-5 w-5" />
                        Tableau de bord
                    </Link>
                </Button>
            </div>
        </div>
    );
}
