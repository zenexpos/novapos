'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { PWAUpdateNotifier } from '@/components/pwa/PWAUpdateNotifier';

/**
 * Client-side providers for the application.
 * Includes theme management, notifications, and PWA updates.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
            storageKey="ipos-theme"
        >
            <NotificationProvider>
                {children}
                <PWAUpdateNotifier />
                <Toaster richColors position="top-right" />
            </NotificationProvider>
        </ThemeProvider>
    );
}
