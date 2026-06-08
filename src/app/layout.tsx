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
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: "iPOS Zen - Elite Ledger",
  description: "نظام محاسبي سيادي صلب وفخم",
  manifest: "/manifest.json",
  icons: {
    icon: '/icon.svg',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: "#AFB42B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr-DZ">
      <body className="antialiased bg-background text-foreground">
        <ServiceWorkerRegister />
        <ClientProviders>
          <TooltipProvider delayDuration={0}>
            <KeyboardShortcutsProvider>
              <AppSyncManager>
                  <div className="flex h-screen flex-col bg-background overflow-hidden relative">
                        <AppHeaderWrapper />
                        <SaleInfoBarWrapper />
                        <main className="flex-1 overflow-y-auto pb-14 md:pb-0 bg-background">
                              {children}
                        </main>
                        <BottomNavBarWrapper />
                        <KeyboardShortcutsHelp />
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
