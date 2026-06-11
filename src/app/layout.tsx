'use client';

import React from 'react';
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
import { PWAUpdateNotifier } from '@/components/pwa/PWAUpdateNotifier';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-FR" suppressHydrationWarning>
      <head>
        <title>iPOS Zen - Gestion Simple</title>
        <meta name="description" content="Système de vente simple et efficace pour gérer vos produits et vos clients" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased bg-background text-foreground overflow-hidden selection:bg-primary/20">
        <ServiceWorkerRegister />
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
                        <PWAUpdateNotifier />
                  </div>
              </AppSyncManager>
            </KeyboardShortcutsProvider>
          </TooltipProvider>
        </ClientProviders>
        <div id="receipt-for-print" className="hidden print:block bg-white min-h-screen w-full"></div>
      </body>
    </html>
  );
}
