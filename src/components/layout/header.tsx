'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, ShoppingCart, BellRing, Archive, Package, 
    Users2, History, Undo2, Wallet, Wheat, Coins, UserCog,
    RefreshCw, Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Clock } from '@/components/layout/clock';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAppStore, useAppActions } from '@/stores/appStore';
import Image from 'next/image';

export function AppHeader() {
    const navLinks = useMemo(() => [
        { href: '/dashboard',     label: 'Dashboard', icon: LayoutDashboard },
        { href: '/sell',          label: 'Vendre',    icon: ShoppingCart },
        { href: '/debt-alerts',   label: 'Alertes',   icon: BellRing },
        { href: '/stock',         label: 'Stock',     icon: Archive },
        { href: '/products',      label: 'Produits',  icon: Package },
        { href: '/customers',     label: 'Clients',   icon: Users2 },
        { href: '/sales-history', label: 'Ventes',    icon: History },
        { href: '/returns',       label: 'Retours',   icon: Undo2 },
        { href: '/expenses',      label: 'Dépenses',  icon: Wallet },
        { href: '/bread',         label: 'Pain',      icon: Wheat },
        { href: '/zakat',         label: 'Zakat',     icon: Coins },
        { href: '/profile',       label: 'Profil',    icon: UserCog },
    ], []);
    
    const pathname = usePathname();
    const { performBackgroundSync } = useAppActions();
    
    const companyProfile = useAppStore(state => state.companyProfile);
    const syncStatus = useAppStore(state => state.syncStatus);
    const isSyncing = syncStatus === 'syncing';

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return (
        <header className="print-hide sticky top-0 z-40 w-full">
            <div className="
                relative flex h-14 items-center gap-2 px-4
                border-b border-border
                bg-card
                shadow-sm
            ">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 shrink-0 group"
                >
                    <div className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                        "bg-secondary",
                        "group-hover:scale-105",
                    )}>
                        <Image 
                            src="/icon.svg" 
                            alt="iPOS Zen Logo" 
                            width={32} 
                            height={32} 
                        />
                    </div>
                    <div className="hidden lg:flex flex-col leading-none ml-1">
                        <span className="font-black text-sm tracking-tight text-foreground uppercase" style={{ fontFamily: 'Syne, sans-serif' }}>
                            iPOS <span className="text-primary">Zen</span>
                        </span>
                        <span className="text-[8px] text-muted-foreground font-black tracking-[0.2em] uppercase">
                            Elite Ledger
                        </span>
                    </div>
                </Link>

                <div className="h-6 w-px bg-border mx-2 shrink-0" />

                <TooltipProvider delayDuration={0}>
                    <nav className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 scrollbar-hide">
                        {navLinks.map((link) => {
                            const isActive = pathname.startsWith(link.href);
                            const Icon = link.icon as React.ElementType;
                            return (
                                <Tooltip key={link.href}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={link.href}
                                            className={cn(
                                                'relative flex items-center justify-center rounded-xl shrink-0 transition-all duration-200',
                                                isActive
                                                    ? 'h-10 px-4 bg-primary text-primary-foreground shadow-sm'
                                                    : 'w-10 h-10 text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                        >
                                            <Icon className={cn(
                                                'h-4.5 w-4.5',
                                                isActive ? 'scale-110' : ''
                                            )} />
                                            {isActive && (
                                                <span className="ml-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                                    {link.label}
                                                </span>
                                            )}
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-card border-border shadow-md">
                                        {link.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </nav>
                </TooltipProvider>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="hidden md:block">
                        <Clock />
                    </div>

                    {companyProfile?.supabase_url && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'h-9 w-9 rounded-xl transition-all',
                                isSyncing
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted',
                            )}
                            onClick={() => performBackgroundSync()}
                            disabled={isSyncing}
                        >
                            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
                        </Button>
                    )}

                    <ThemeToggle />

                    {companyProfile?.companyName && (
                        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground font-black text-[10px] uppercase tracking-wider shadow-sm">
                            <Building className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[120px]">
                                {companyProfile.companyName}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}