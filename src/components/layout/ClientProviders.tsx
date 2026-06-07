'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';
import { NotificationProvider } from '@/contexts/NotificationContext';

/**
 * Client-side providers for the application.
 * Includes theme management, notifications, and global error suppression for known library issues.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // NOTE: Recharts v2.15+ has fixed defaultProps warnings for React 19.
        // The console.error override has been removed.
    }, []);

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
                <Toaster richColors position="top-right" />
            </NotificationProvider>
        </ThemeProvider>
    );
}
