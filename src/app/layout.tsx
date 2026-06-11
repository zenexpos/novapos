import React from 'react';
import type { Metadata, Viewport } from 'next';
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
import { PWAUpdateNotifier } from '@/components/pwa/PWAUpdateNotifier';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: "iPOS Zen - Elite Ledger",
  description: "Système comptable souverain, robuste et luxueux pour la gestion des ventes et du stock",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "iPOS Zen",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: "#AFB42B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr-DZ" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground overflow-hidden">
        <ServiceWorkerRegister />
        <ClientProviders>
          <TooltipProvider delayDuration={0}>
            <KeyboardShortcutsProvider>
              <AppSyncManager>
                  <div className="flex h-screen flex-col bg-background relative overflow-hidden">
                        <AppHeaderWrapper />
                        <SaleInfoBarWrapper />
                        <main className="flex-1 overflow-y-auto pb-14 md:pb-0 bg-background">
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
