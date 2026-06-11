'use client';

import React, { useState, useEffect } from 'react';
import './globals.css';
import { ClientProviders } from '@/components/layout/ClientProviders';
import { AppHeaderWrapper } from '@/components/layout/AppHeaderWrapper';
import { BottomNavBarWrapper } from '@/components/layout/BottomNavBarWrapper';
import { SaleInfoBarWrapper } from '@/components/layout/SaleInfoBarWrapper';
import { AppSyncManager } from '@/components/layout/AppSyncManager';
import { KeyboardShortcutsProvider } from '@/contexts/shortcut-context';
import { KeyboardShortcutsHelp } from '@/components/layout/KeyboardShortcutsHelp';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';

/**
 * Layout Racine iPOS Zen — Enterprise Edition.
 * Gère l'hydratation sécurisée et l'initialisation des services Offline.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="fr-FR" suppressHydrationWarning>
      <head>
        <title>iPOS Zen — Système POS Souverain</title>
        <meta name="description" content="Gestion de point de vente locale et synchronisée" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#AFB42B" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="antialiased bg-background text-foreground overflow-hidden selection:bg-primary/20">
        <ServiceWorkerRegister />
        {mounted ? (
          <ClientProviders>
            <TooltipProvider delayDuration={0}>
              <KeyboardShortcutsProvider>
                <AppSyncManager>
                    <div className="flex h-screen flex-col bg-background relative overflow-hidden">
                          <AppHeaderWrapper />
                          <SaleInfoBarWrapper />
                          <main className="flex-1 overflow-y-auto pb-14 md:pb-0 bg-background custom-scrollbar">
                                {children}
                          </main>
                          <BottomNavBarWrapper />
                          <KeyboardShortcutsHelp />
                          <PWAInstallPrompt />
                    </div>
                </AppSyncManager>
              </KeyboardShortcutsProvider>
            </TooltipProvider>
          </ClientProviders>
        ) : (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="animate-pulse flex flex-col items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-lg bg-primary/40" />
              </div>
              <div className="h-4 w-40 rounded bg-slate-200" />
            </div>
          </div>
        )}
        <div id="receipt-for-print" className="hidden print:block bg-white min-h-screen w-full"></div>
      </body>
    </html>
  );
}
