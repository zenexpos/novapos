'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Settings, Package, Users2, History, Undo2, Archive,
    Wallet, LayoutDashboard, Wheat, ShoppingCart, Building,
    Coins, BellRing, RefreshCw, Crown, UserCog,
    Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Clock } from '@/components/layout/clock';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAppStore, useAppActions } from '@/stores/appStore';

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
        { href: '/install',       label: 'Installer', icon: Smartphone },
    ], []);
    
    const pathname = usePathname();
    const { performBackgroundSync } = useAppActions();
    
    const companyProfile = useAppStore(state => state.companyProfile);
    const syncStatus = useAppStore(state => state.syncStatus);
    
    const isSyncing = syncStatus === 'syncing';

    const [mounted, setMounted]             = useState(false);
    const navRef                            = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    return (
        <header className="print-hide sticky top-0 z-40 w-full">
            {/* Glass header panel */}
            <div className="
                relative flex h-13 items-center gap-2 px-3
                border-b border-border
                bg-card/95
                shadow-sm
            ">
                {/* Ambient top highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none" />

                {/* ── Logo ── */}
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 shrink-0 group"
                >
                    {/* New Zen Elite Logo */}
                    <div className={cn(
                        "relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-500",
                        "bg-gradient-to-br from-primary to-amber-700",
                        "border border-white/10",
                        "shadow-[0_0_15px_rgba(192,120,20,0.3)]",
                        "group-hover:shadow-[0_0_20px_rgba(192,120,20,0.5)] group-hover:scale-110",
                    )}>
                        <Crown className="h-4.5 w-4.5 text-white fill-white/20" />
                    </div>
                    <div className="hidden lg:flex flex-col leading-none">
                        <span className="font-black text-sm tracking-tight text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>
                            iPOS <span className="text-primary">Zen</span>
                        </span>
                        <span className="text-[8px] text-muted-foreground/50 font-black tracking-[0.2em] uppercase">
                            Elite System
                        </span>
                    </div>
                </Link>

                {/* Divider */}
                <div className="h-5 w-px bg-gradient-to-b from-transparent via-border to-transparent mx-1 shrink-0" />

                {/* ── Navigation ── */}
                <TooltipProvider delayDuration={0}>
                    <nav ref={navRef} className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 scrollbar-hide">
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
                                                        ? 'h-9 px-4 bg-primary/10 border border-primary/25 text-primary shadow-sm w-auto animate-scale-in'
                                                        : 'w-9 h-9 text-muted-foreground border border-transparent hover:bg-primary/5 hover:text-foreground'
                                                )}
                                            >
                                                <Icon className={cn(
                                                    'h-4 w-4 transition-transform duration-300',
                                                    isActive ? 'scale-110' : 'group-hover:scale-110',
                                                )} />
                                                
                                                {isActive && (
                                                    <span className="ml-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-500">
                                                        {link.label}
                                                    </span>
                                                )}

                                                {/* Active indicator dot */}
                                                {isActive && (
                                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_4px_var(--glow-primary)] animate-scale-in" />
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

                {/* ── Right Controls ── */}
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {/* Clock */}
                    {mounted && (
                        <div className="hidden md:flex items-center px-2.5 py-1 rounded-lg border border-border bg-card/95 text-xs text-muted-foreground font-mono gap-1.5 shadow-sm">
                            <Clock />
                        </div>
                    )}

                    {/* Sync button */}
                    {mounted && companyProfile?.supabase_url && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>
                                    <Button
                                        aria-label={isSyncing ? 'Synchronisation en cours' : 'Synchroniser'}
                                        title={isSyncing ? 'Synchronisation en cours' : 'Synchroniser'}
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
                    )}

                    {/* Settings */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <Link
                                    href="/settings"
                                    aria-label="Paramètres"
                                    title="Paramètres"
                                    className={cn(
                                        'inline-flex items-center justify-center h-8 w-8 rounded-lg border border-transparent transition-all duration-200',
                                        pathname.startsWith('/settings')
                                            ? 'border-primary/25 bg-primary/12 text-primary'
                                            : 'hover:bg-primary/8 hover:border-primary/15 text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <Settings className="h-3.5 w-3.5" />
                                </Link>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">Paramètres</TooltipContent>
                    </Tooltip>

                    {/* Theme toggle */}
                    <div className="flex items-center">
                        <ThemeToggle />
                    </div>

                    {/* Company name chip */}
                    {mounted && companyProfile?.companyName && (
                        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card/95 max-w-[140px] shadow-sm">
                            <Building className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-xs text-foreground/80 truncate font-medium">
                                {companyProfile.companyName}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}