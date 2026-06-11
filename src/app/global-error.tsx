'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCcw, DatabaseBackup } from 'lucide-react';

/**
 * Enterprise Root Error Boundary.
 * This is the last line of defense against application crashes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[iPOS Zen Root Failure]:', error);
  }, [error]);

  const handleHardReset = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <html>
      <body className="bg-[#F8FAFC] text-[#0F172A] antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="p-10 rounded-[2.5rem] bg-destructive/5 border-2 border-destructive/10 mb-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-destructive/5 animate-pulse group-hover:scale-110 transition-transform duration-1000" />
            <ShieldAlert className="h-20 w-20 text-destructive relative z-10" />
          </div>
          
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-4 text-secondary">
            Erreur Critique Système
          </h1>
          
          <p className="text-muted-foreground font-medium max-w-md mx-auto mb-10 leading-relaxed">
            Un composant vital du moteur iPOS Zen a cessé de fonctionner. 
            <span className="block mt-2 font-bold text-secondary/60">
              Vos données locales restent protégées dans le cache sécurisé.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button 
              variant="default" 
              size="xl" 
              onClick={() => reset()} 
              className="flex-1 rounded-2xl shadow-xl gap-3"
            >
              <RefreshCcw className="h-5 w-5" />
              Réessayer
            </Button>
            
            <Button 
              variant="outline" 
              size="xl" 
              onClick={handleHardReset}
              className="flex-1 rounded-2xl border-secondary/10 bg-white hover:bg-muted gap-3"
            >
              <DatabaseBackup className="h-5 w-5" />
              Accueil
            </Button>
          </div>

          <footer className="fixed bottom-10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
            Titanium Recovery Engine • iPOS Zen v2.9
          </footer>
        </div>
      </body>
    </html>
  );
}
