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
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';
import { Metadata, Viewport } from 'next';

/**
 * Metadata iPOS Zen — Configuration souveraine via l'API Next.js.
 */
export const metadata: Metadata = {
  title: 'iPOS Zen — Système POS Souverain',
  description: 'Gestion de point de vente locale et sécurisée',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'iPOS Zen',
    statusBarStyle: 'default',
  },
};

/**
 * Configuration du viewport pour une expérience mobile native.
 */
export const viewport: Viewport = {
  themeColor: '#AFB42B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * Layout Racine iPOS Zen — Enterprise Edition.
 * Converti en Server Component pour garantir une hydratation stable.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-FR" suppressHydrationWarning>
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
