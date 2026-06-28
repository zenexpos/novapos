import React from 'react';
import './globals.css';
import { ClientProviders } from '@/components/layout/ClientProviders';
import { AppHeaderWrapper } from '@/components/layout/AppHeaderWrapper';
import { BottomNavBarWrapper } from '@/components/layout/BottomNavBarWrapper';
import { AppSyncManager } from '@/components/layout/AppSyncManager';
import { KeyboardShortcutsProvider } from '@/contexts/KeyboardShortcutsContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';
import { Metadata, Viewport } from 'next';
import { APP_CONFIG } from '@/lib/config/app-config';

export const metadata: Metadata = {
  title: 'iPOS Zen — Système POS Souverain',
  description: 'Gestion de point de vente locale, sécurisée et hors-ligne.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: ['/icon.svg'],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: APP_CONFIG.pwa.themeColor,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-FR" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground overflow-hidden selection:bg-primary/20" suppressHydrationWarning>
        <ServiceWorkerRegister />
        <ClientProviders>
          <TooltipProvider delayDuration={0}>
            <KeyboardShortcutsProvider>
              <AppSyncManager>
                <div className="flex h-screen flex-col bg-background relative overflow-hidden">
                  <AppHeaderWrapper />
                  <main className="flex-1 overflow-y-auto pb-14 md:pb-0 bg-background custom-scrollbar">
                    {children}
                  </main>
                  <BottomNavBarWrapper />
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
