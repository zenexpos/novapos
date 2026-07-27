'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, 
    ShoppingCart, 
    BellRing, 
    Archive, 
    Package, 
    Users2, 
    History, 
    Undo2, 
    Wallet, 
    Wheat, 
    Coins, 
    UserCog,
    RefreshCw, 
    Settings, 
    Download, 
    Wifi, 
    WifiOff, 
    ChartBar
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
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useNetwork } from '@/hooks/useNetwork';

/**
 * Enterprise Application Header.
 * Standardisé 100% Français.
 */
export function AppHeader() {
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const { performBackgroundSync } = useAppActions();
    const { isInstallable, install } = usePwaInstall();
    const { isOnline } = useNetwork();
    
    const companyProfile = useAppStore(state => state.companyProfile);
    const syncStatus = useAppStore(state => state.syncStatus);
    const isSyncing = syncStatus === 'syncing';

    useEffect(() => { 
        setMounted(true); 
    }, []);

    const navLinks = useMemo(() => [
        { href: '/dashboard',     label: 'Dashboard', icon: LayoutDashboard },
        { href: '/sell',          label: 'Vendre',    icon: ShoppingCart },
        { href: '/products',      label: 'Produits',  icon: Package },
        { href: '/customers',     label: 'Clients',   icon: Users2 },
        { href: '/stock',         label: 'Stock',     icon: Archive },
        { href: '/sales-history', label: 'Journal',   icon: History },
        { href: '/returns',       label: 'Retours',   icon: Undo2 },
        { href: '/debt-alerts',   label: 'Alertes',   icon: BellRing },
        { href: '/expenses',      label: 'Dépenses',  icon: Wallet },
        { href: '/reports',       label: 'Analyses',  icon: ChartBar },
        { href: '/bread',         label: 'Pain',      icon: Wheat },
        { href: '/zakat',         label: 'Zakat',     icon: Coins },
        { href: '/profile',       label: 'Profil',    icon: UserCog },
        { href: '/settings',      label: 'Réglages',  icon: Settings },
    ], []);

    if (!mounted) {
        return <header className="h-14 bg-secondary border-b border-white/10" />;
    }

    return (
        <header className="print-hide sticky top-0 z-40 w-full h-14 bg-secondary border-b border-white/10">
            <div className="flex h-full items-center gap-2 px-4">
                <Link href="/dashboard" className="flex items-center gap-2 shrink-0 group">
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-md">
                        <Image src="/icon.svg" alt="iPOS Zen" width={22} height={22} />
                    </div>
                    <div className="hidden lg:flex flex-col leading-none ml-1 text-white">
                        <span className="font-black text-xs tracking-tight uppercase">iPOS <span className="text-primary">Zen</span></span>
                        <span className="text-[7px] text-primary font-bold tracking-widest uppercase opacity-60">Sovereign</span>
                    </div>
                </Link>

                <div className="h-6 w-px bg-white/10 mx-2 shrink-0" />

                <TooltipProvider delayDuration={0}>
                    <nav className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0 scrollbar-hide px-2">
                        {navLinks.map((link) => {
                            const isActive = pathname.startsWith(link.href);
                            const Icon = link.icon as React.ElementType;
                            return (
                                <Tooltip key={link.href}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={link.href}
                                            className={cn(
                                                'relative flex items-center justify-center rounded-lg shrink-0 transition-all duration-200',
                                                isActive
                                                    ? 'h-8 px-3 bg-primary text-primary-foreground shadow-sm'
                                                    : 'w-8 h-8 text-white/40 hover:bg-white/10 hover:text-white'
                                            )}
                                        >
                                            <Icon className={cn('h-4 w-4', isActive && 'scale-110')} />
                                            {isActive && <span className="ml-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{link.label}</span>}
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-secondary text-white border-none font-bold text-[10px] uppercase">{link.label}</TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </nav>
                </TooltipProvider>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/20 border border-white/5 mr-2">
                        {isOnline ? (
                            <Wifi className="h-3 w-3 text-emerald-400" />
                        ) : (
                            <WifiOff className="h-3 w-3 text-destructive animate-pulse" />
                        )}
                        <span className={cn("text-[8px] font-black uppercase", isOnline ? "text-emerald-400" : "text-destructive")}>
                            {isOnline ? "On" : "Off"}
                        </span>
                    </div>

                    <div className="hidden md:block text-white/80">
                        <Clock />
                    </div>

                    {companyProfile?.supabaseUrl && isOnline && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className={cn('h-8 w-8 rounded-lg text-white/40 hover:text-white', isSyncing && 'text-primary')}
                            onClick={() => performBackgroundSync()}
                            disabled={isSyncing}
                        >
                            <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
                        </Button>
                    )}

                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
