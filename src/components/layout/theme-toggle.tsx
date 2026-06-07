'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) {
        return (
            <div className="h-8 w-8 rounded-lg border border-transparent bg-muted/30 animate-pulse" />
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-transparent hover:bg-primary/8 hover:border-primary/15 text-muted-foreground hover:text-foreground transition-all duration-200"
                    aria-label="Changer de thème"
                >
                    <Sun  className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
                {[
                    { value: 'light',  label: 'Clair',    Icon: Sun     },
                    { value: 'dark',   label: 'Sombre',   Icon: Moon    },
                    { value: 'system', label: 'Système',  Icon: Monitor },
                ].map(({ value, label, Icon }) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => setTheme(value)}
                        className={cn(
                            'flex items-center gap-2 cursor-pointer',
                            theme === value && 'text-primary font-black',
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                        {theme === value && (
                            <span className="ml-auto text-[8px] font-black text-primary uppercase tracking-widest">
                                Actif
                            </span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
