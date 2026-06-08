'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { Package, LayoutDashboard, ShoppingCart, Archive, BellRing, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
    { href: '/dashboard',   label: 'Dash', icon: LayoutDashboard },
    { href: '/products',    label: 'Items', icon: Package },
    { href: '/sell',        label: 'Vendre', icon: ShoppingCart },
    { href: '/debt-alerts', label: 'Dettes', icon: BellRing },
    { href: '/stock',       label: 'Stock', icon: Archive },
    { href: '/settings',    label: 'Réglages', icon: Settings },
];

export function BottomNavBar() {
    const pathname = usePathname();
    return (
        <div className="print-hide fixed bottom-0 left-0 z-30 w-full md:hidden">
            {/* Solid panel */}
            <div className="
                relative h-18
                border-t border-border
                bg-card
                shadow-sm
            ">
                <div className="grid grid-cols-6 h-full px-1">
                    {links.map(link => {
                        const active = pathname.startsWith(link.href);
                        const Icon = link.icon as React.ElementType;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-0.5 px-0.5 transition-all duration-300',
                                    'text-muted-foreground text-[9px] font-semibold',
                                    active && 'text-primary',
                                )}
                            >
                                <div className={cn(
                                    'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-500',
                                    active && [
                                        'bg-primary/10 text-primary',
                                        'border border-primary/20',
                                        'scale-105',
                                    ]
                                )}>
                                    <Icon className={cn(
                                        'transition-transform duration-300',
                                        active ? 'h-5 w-5' : 'h-5 w-5 opacity-60',
                                    )} />
                                </div>
                                <span className={cn(
                                    "text-[7px] font-black uppercase tracking-tighter truncate w-full text-center",
                                    active ? "opacity-100" : "opacity-40"
                                )}>
                                    {link.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}