'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCcw, Home } from 'lucide-react';

/**
 * Dernier rempart contre le crash complet du système Enterprise.
 * Permet de redémarrer l'application sans perdre les données locales.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[iPOS Zen Critical Failure]:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="p-10 rounded-full bg-red-500/10 border-2 border-red-500/20 mb-8 animate-pulse">
            <ShieldAlert className="h-20 w-20 text-red-600" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">Erreur Système</h1>
          <p className="text-slate-500 font-medium max-w-md mx-auto mb-10 leading-relaxed">
            Une erreur critique est survenue. Vos données sont en sécurité dans votre appareil. 
            Veuillez essayer de redémarrer le système.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button onClick={() => reset()} size="lg" className="flex-1 rounded-2xl shadow-xl gap-2">
              <RefreshCcw className="h-5 w-5" /> Réessayer
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} size="lg" className="flex-1 rounded-2xl border-slate-200 bg-white gap-2">
              <Home className="h-5 w-5" /> Accueil
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
