'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCcw } from 'lucide-react';

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

  return (
    <html>
      <body className="bg-background text-foreground antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="p-8 rounded-3xl bg-destructive/10 border border-destructive/20 mb-8 animate-pulse">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">Erreur Critique Système</h1>
          <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8 leading-relaxed">
            Un composant vital du moteur iPOS Zen a cessé de fonctionner. 
            Vos données locales IndexedDB restent protégées.
          </p>
          <Button 
            variant="default" 
            size="lg" 
            onClick={() => reset()} 
            className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest gap-2 shadow-xl"
          >
            <RefreshCcw className="h-5 w-5" />
            Réinitialiser le Moteur
          </Button>
        </div>
      </body>
    </html>
  );
}
