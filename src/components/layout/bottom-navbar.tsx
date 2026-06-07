'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { Package, Users2, LayoutDashboard, ShoppingCart, Archive, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
    { href: '/dashboard',   label: 'Dashboard', icon: LayoutDashboard },
    { href: '/products',    label: 'Produits',  icon: Package },
    { href: '/sell',        label: 'Vendre',    icon: ShoppingCart },
    { href: '/debt-alerts', label: 'Alertes',   icon: BellRing },
    { href: '/stock',       label: 'Stock',     icon: Archive },
];

export function BottomNavBar() {
    const pathname = usePathname();
    return (
        <div className="print-hide fixed bottom-0 left-0 z-30 w-full md:hidden">
            {/* Glass panel */}
            <div className="
                relative h-20
                border-t border-border
                bg-card/95
                shadow-sm
            ">
                {/* Top highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent pointer-events-none" />

                <div className="grid grid-cols-5 h-full px-2">
                    {links.map(link => {
                        const active = pathname.startsWith(link.href);
                        const isSell = link.href === '/sell';
                        const Icon = link.icon as React.ElementType;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-1 px-1 py-1 transition-all duration-300',
                                    'text-muted-foreground text-[10px] font-semibold',
                                    active && 'text-primary',
                                )}
                            >
                                {/* Icon container */}
                                <div className={cn(
                                    'relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-500',
                                    active && [
                                        'bg-primary/15 text-primary',
                                        'border border-primary/20',
                                        'shadow-sm',
                                        'scale-110',
                                    ],
                                    !active && 'hover:bg-primary/5'
                                )}>
                                    <Icon className={cn(
                                        'transition-transform duration-300',
                                        active ? 'h-5 w-5' : 'h-5 w-5 opacity-60',
                                    )} />
                                </div>

                                {/* Active indicator */}
                                {active && (
                                    <span className="text-[8px] font-black uppercase tracking-tighter animate-in fade-in slide-in-from-bottom-1 duration-500">
                                        {link.label}
                                    </span>
                                )}

                                {!active && (
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/10" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
