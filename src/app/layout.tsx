'use client';

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
