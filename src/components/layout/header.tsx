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

export function AppHeader() {
    const navLinks = useMemo(() => [
        { href: '/dashboard',     label: 'Dashboard', icon: LayoutDashboard },
        { href: '/sell',          label: 'Vendre',    icon: ShoppingCart },
        { href: '/products',      label: 'Produits',  icon: Package },
        { href: '/customers',     label: 'Clients',   icon: Users2 },
        { href: '/stock',         label: 'Logistique',icon: Archive },
        { href: '/sales-history', label: 'Journal',   icon: History },
        { href: '/returns',       label: 'Retours',   icon: Undo2 },
        { href: '/debt-alerts',   label: 'Alertes',   icon: BellRing },
        { href: '/expenses',      label: 'Charges',   icon: Wallet },
        { href: '/reports',       label: 'Analyses',  icon: ChartBar },
        { href: '/bread',         label: 'Pain',      icon: Wheat },
        { href: '/zakat',         label: 'Zakat',     icon: Coins },
        { href: '/profile',       label: 'Profil',    icon: UserCog },
        { href: '/install',       label: 'Installer', icon: Download },
        { href: '/settings',      label: 'Système',   icon: Settings },
    ], []);
    
    const pathname = usePathname();
    const { performBackgroundSync } = useAppActions();
    const { isInstallable, install } = usePwaInstall();
    const { status: networkStatus, isOnline } = useNetwork();
    
    const companyProfile = useAppStore(state => state.companyProfile);
    const syncStatus = useAppStore(state => state.syncStatus);
    const isSyncing = syncStatus === 'syncing';

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return (
        <header className="print-hide sticky top-0 z-40 w-full nav-solid h-14">
            <div className="flex h-full items-center gap-2 px-4 shadow-sm">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 shrink-0 group"
                >
                    <div className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 bg-white shadow-lg group-hover:scale-105 group-hover:rotate-2">
                        <Image 
                            src="/icon.svg" 
                            alt="iPOS Zen Logo" 
                            width={28} 
                            height={28} 
                            className="drop-shadow-sm"
                        />
                    </div>
                    <div className="hidden lg:flex flex-col leading-none ml-1 text-white">
                        <span className="font-black text-sm tracking-tight uppercase">
                            iPOS <span className="text-primary">Zen</span>
                        </span>
                        <span className="text-[8px] text-primary font-black tracking-[0.2em] uppercase opacity-70">
                            Titanium Offline
                        </span>
                    </div>
                </Link>

                <div className="h-6 w-px bg-white/10 mx-2 shrink-0" />

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 border border-white/5">
                    {isOnline ? (
                        <div className={cn("flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter", 
                            networkStatus === 'degraded' ? "text-amber-400" : "text-emerald-400")}>
                            <Wifi className="h-3 w-3" />
                            {networkStatus === 'degraded' ? 'Lent' : 'Cloud'}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter text-destructive animate-pulse">
                            <WifiOff className="h-3 w-3" />
                            Offline
                        </div>
                    )}
                </div>

                <TooltipProvider delayDuration={0}>
                    <nav className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 scrollbar-hide px-2">
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
                                                    ? 'h-9 px-4 bg-primary text-primary-foreground shadow-md'
                                                    : 'w-9 h-9 text-white/60 hover:bg-white/10 hover:text-white'
                                            )}
                                        >
                                            <Icon className={cn(
                                                'h-4 w-4',
                                                isActive ? 'scale-110' : ''
                                            )} />
                                            {isActive && (
                                                <span className="ml-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                                    {link.label}
                                                </span>
                                            )}
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-secondary text-white border-none font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg shadow-xl">
                                        {link.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </nav>
                </TooltipProvider>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {isInstallable && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={install}
                            className="h-9 px-4 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-lg animate-install gap-2 border border-white/10"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">Install</span>
                        </Button>
                    )}

                    <div className="hidden md:block text-white/80">
                        <Clock />
                    </div>

                    {companyProfile?.supabase_url && isOnline && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'h-9 w-9 rounded-xl transition-all text-white/60 hover:text-white hover:bg-white/10',
                                isSyncing && 'text-primary'
                            )}
                            onClick={() => performBackgroundSync()}
                            disabled={isSyncing}
                        >
                            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
                        </Button>
                    )}

                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
