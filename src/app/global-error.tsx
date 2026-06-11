'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCcw, Home, LifeBuoy } from 'lucide-react';

/**
 * Barrière de sécurité ultime d'iPOS Zen.
 * En cas de crash fatal de Next.js, ce composant protège l'intégrité des données locales.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CRITICAL SYSTEM FAILURE]:', error);
  }, [error]);

  const handleFullRestart = () => {
    window.location.href = '/';
  };

  return (
    <html>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center max-w-lg mx-auto">
          <div className="p-10 rounded-full bg-red-500/10 border-2 border-red-500/20 mb-8 animate-pulse shadow-xl">
            <ShieldAlert className="h-20 w-20 text-red-600" />
          </div>
          
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-4 text-slate-900">
            Erreur Système Critique
          </h1>
          
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            Une interruption majeure est survenue. Vos données locales sont <span className="font-bold text-emerald-600">en sécurité</span>. 
            Le système doit être réinitialisé pour garantir la stabilité de la base de données.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button 
                onClick={() => reset()} 
                size="lg" 
                className="flex-1 rounded-2xl shadow-xl gap-2 font-black uppercase text-xs h-14"
            >
              <RefreshCcw className="h-5 w-5" /> Tenter Reprise
            </Button>
            <Button 
                variant="outline" 
                onClick={handleFullRestart} 
                size="lg" 
                className="flex-1 rounded-2xl border-slate-200 bg-white gap-2 font-black uppercase text-xs h-14"
            >
              <Home className="h-5 w-5" /> Accueil
            </Button>
          </div>

          <div className="mt-16 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
            <LifeBuoy className="h-5 w-5 text-blue-500" />
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider text-left">
              Besoin d'aide ? Contactez le support technique iPOS Zen via le portail Titanium.
            </p>
          </div>

          <p className="mt-20 text-[10px] font-black uppercase text-muted-foreground/20 tracking-[0.4em]">
            Sovereign POS Engine • Internal Recovery Mode
          </p>
        </div>
      </body>
    </html>
  );
}
