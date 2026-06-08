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

const APP_NAME = "iPOS Zen";
const APP_DEFAULT_TITLE = "iPOS Zen - Elite Ledger & System";
const APP_TITLE_TEMPLATE = "%s - iPOS Zen";
const APP_DESCRIPTION = "Application de point de vente souveraine, intelligente et local-first.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" }, 
    { media: "(prefers-color-scheme: light)", color: "#AFB42B" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 3,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr-DZ" suppressHydrationWarning>
      <head>
         <link rel="icon" href="/icon.svg" type="image/svg+xml" />
         <link rel="shortcut icon" href="/icon.svg" type="image/svg+xml" />
         <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body suppressHydrationWarning className="antialiased selection:bg-primary/20 bg-background text-foreground">
        <ServiceWorkerRegister />
        <ClientProviders>
          <TooltipProvider delayDuration={0}>
            <KeyboardShortcutsProvider>
              <AppSyncManager>
                  <div className="flex h-screen flex-col bg-background overflow-hidden relative">
                      <div className="relative z-10 flex flex-col h-full overflow-hidden">
                        <AppHeaderWrapper />
                        <SaleInfoBarWrapper />
                        <main className="flex-1 overflow-y-auto pb-14 md:pb-0 scroll-smooth bg-background">
                            <div className="relative z-10">
                              {children}
                            </div>
                        </main>
                        <BottomNavBarWrapper />
                        <KeyboardShortcutsHelp />
                      </div>
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