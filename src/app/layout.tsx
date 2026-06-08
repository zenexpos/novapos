import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/layout/ClientProviders';
import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { SaleInfoBar } from '@/components/layout/SaleInfoBar';
import { AppSyncManager } from '@/components/layout/AppSyncManager';
import { KeyboardShortcutsProvider } from '@/contexts/KeyboardShortcutsContext';
import { KeyboardShortcutsHelp } from '@/components/layout/KeyboardShortcutsHelp';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';

const APP_NAME = "iPOS Zen";
const APP_DEFAULT_TITLE = "iPOS Zen - Point de Vente Premium";
const APP_TITLE_TEMPLATE = "%s - iPOS Zen";
const APP_DESCRIPTION = "Application de point de vente intelligente et local-first";

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
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0D0804" }, { media: "(prefers-color-scheme: light)", color: "#c07814" }],
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
         <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
         <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning>
        <ServiceWorkerRegister />
        <ClientProviders>
          <TooltipProvider delayDuration={0}>
            <KeyboardShortcutsProvider>
              <AppSyncManager>
                  <div className="flex h-screen flex-col bg-background overflow-hidden">
                      <AppHeader />
                      <SaleInfoBar />
                      <main className="flex-1 overflow-y-auto pb-14 md:pb-0">
                          <>
              <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/8 blur-[80px] animate-ambient" />
                <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-accent/6 blur-[60px] animate-ambient anim-delay-400" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/4 blur-[100px] animate-ambient anim-delay-200" />
              </div>
              {children}
            </>
                      </main>
                      <BottomNavBar />
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
