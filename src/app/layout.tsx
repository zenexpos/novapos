import React from 'react';
import './globals.css';
import { ClientProviders } from '@/components/layout/ClientProviders';
import { AppHeaderWrapper } from '@/components/layout/AppHeaderWrapper';
import { BottomNavBarWrapper } from '@/components/layout/BottomNavBarWrapper';
import { SaleInfoBarWrapper } from '@/components/layout/SaleInfoBarWrapper';
import { AppSyncManager } from '@/components/layout/AppSyncManager';
import { KeyboardShortcutsProvider } from '@/contexts/KeyboardShortcutsContext';
import { KeyboardShortcutsHelp } from '@/components/layout/KeyboardShortcutsHelp';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';
import { Metadata, Viewport } from 'next';

/**
 * RootLayout - Server Component.
 * Utilise l'API Metadata pour éviter les erreurs d'hydratation et optimiser le SEO.
 */
export const metadata: Metadata = {
  title: 'iPOS Zen — Système POS Souverain',
  description: 'Gestion de point de vente locale et sécurisée',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/icon.svg'],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'iPOS Zen',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#AFB42B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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
