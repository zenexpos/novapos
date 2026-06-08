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
        { href: '/dashboard',     label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
        { href: '/sell',          label: 'Vendre',    icon: ShoppingCart,    color: 'text-primary' },
        { href: '/debt-alerts',   label: 'Alertes',   icon: BellRing,        color: 'text-red-500' },
        { href: '/stock',         label: 'Stock',     icon: Archive,         color: 'text-amber-500' },
        { href: '/products',      label: 'Produits',  icon: Package,         color: 'text-emerald-500' },
        { href: '/customers',     label: 'Clients',   icon: Users2,          color: 'text-violet-500' },
        { href: '/sales-history', label: 'Ventes',    icon: History,         color: 'text-slate-500' },
        { href: '/returns',       label: 'Retours',   icon: Undo2,           color: 'text-rose-500' },
        { href: '/expenses',      label: 'Dépenses',  icon: Wallet,          color: 'text-orange-500' },
        { href: '/bread',         label: 'Pain',      icon: Wheat,           color: 'text-yellow-600' },
        { href: '/zakat',         label: 'Zakat',     icon: Coins,           color: 'text-emerald-600' },
        { href: '/profile',       label: 'Profil',    icon: UserCog,         color: 'text-primary' },
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
                relative flex h-13 items-center gap-2 px-3
                border-b border-border
                bg-card/95
                shadow-sm
            ">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none" />

                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 shrink-0 group"
                >
                    <div className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-500",
                        "bg-gradient-to-br from-primary/20 to-primary/5",
                        "border border-primary/20",
                        "shadow-[0_0_15px_rgba(192,120,20,0.1)]",
                        "group-hover:shadow-[0_0_20px_rgba(192,120,20,0.3)] group-hover:scale-105",
                    )}>
                        <Image 
                            src="/icon.svg" 
                            alt="iPOS Zen Logo" 
                            width={32} 
                            height={32} 
                            className="group-hover:rotate-6 transition-transform duration-500 filter drop-shadow-md"
                        />
                    </div>
                    <div className="hidden lg:flex flex-col leading-none ml-1">
                        <span className="font-black text-sm tracking-tight text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>
                            iPOS <span className="text-primary">Zen</span>
                        </span>
                        <span className="text-[8px] text-muted-foreground/50 font-black tracking-[0.2em] uppercase">
                            Elite System
                        </span>
                    </div>
                </Link>

                <div className="h-5 w-px bg-gradient-to-b from-transparent via-border to-transparent mx-1 shrink-0" />

                <TooltipProvider delayDuration={0}>
                    <nav className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 scrollbar-hide">
                        {navLinks.map((link, idx) => {
                            const isActive = pathname.startsWith(link.href);
                            const Icon = link.icon as React.ElementType;
                            return (
                                <Tooltip key={link.href}>
                                    <TooltipTrigger asChild>
                                        <span>
                                            <Link
                                                href={link.href}
                                                aria-label={link.label}
                                                style={{ animationDelay: `${idx * 40}ms` }}
                                                className={cn(
                                                    'relative flex items-center justify-center rounded-xl shrink-0 group transition-all duration-500',
                                                    isActive
                                                        ? 'h-9 px-4 bg-primary/10 border border-primary/25 text-primary shadow-sm w-auto'
                                                        : 'w-9 h-9 text-muted-foreground border border-transparent hover:bg-primary/5 hover:text-foreground'
                                                )}
                                            >
                                                <Icon className={cn(
                                                    'h-4 w-4 transition-transform duration-300',
                                                    isActive ? 'scale-110' : 'group-hover:scale-110',
                                                    !isActive && link.color
                                                )} />
                                                
                                                {isActive && (
                                                    <span className="ml-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-500">
                                                        {link.label}
                                                    </span>
                                                )}

                                                {isActive && (
                                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_4px_var(--glow-primary)]" />
                                                )}
                                            </Link>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="bottom"
                                        className="text-xs font-medium bg-card/95 border border-border shadow-sm"
                                    >
                                        {link.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </nav>
                </TooltipProvider>

                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <div className="hidden md:flex items-center px-2.5 py-1 rounded-lg border border-border bg-card/95 text-xs text-muted-foreground font-mono gap-1.5 shadow-sm">
                        <Clock />
                    </div>

                    {companyProfile?.supabase_url && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <Button
                                            aria-label={isSyncing ? 'Synchronisation en cours' : 'Synchroniser'}
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                'h-8 w-8 rounded-lg border border-transparent transition-all duration-200',
                                                isSyncing
                                                    ? 'border-primary/25 bg-primary/10 text-primary'
                                                    : 'hover:bg-primary/8 hover:border-primary/15 text-muted-foreground hover:text-foreground',
                                            )}
                                            onClick={() => performBackgroundSync()}
                                            disabled={isSyncing}
                                        >
                                            <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                    {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <ThemeToggle />

                    {companyProfile?.companyName && (
                        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-lg border border-primary/20 bg-primary/5 max-w-[1400px] shadow-sm">
                            <Building className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-[10px] font-black uppercase text-primary truncate">
                                {companyProfile.companyName}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}