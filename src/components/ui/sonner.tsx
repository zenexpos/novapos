'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toaster — sonner v2
 * Breaking change: toastOptions.classNames → style only, CSS variables preferred
 */
const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = 'system' } = useTheme();
    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            style={{
                '--normal-bg':     'var(--glass-bg)',
                '--normal-border': 'var(--glass-border)',
                '--normal-text':   'hsl(var(--foreground))',
            } as React.CSSProperties}
            toastOptions={{
                classNames: {
                    toast:        'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                    description:  'group-[.toast]:text-muted-foreground',
                    actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                    cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
