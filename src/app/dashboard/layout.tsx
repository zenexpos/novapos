'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePOSStore } from '@/lib/pos-store';
import { 
  ShoppingBag, 
  Package, 
  BarChart3, 
  LogOut, 
  Settings, 
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = usePOSStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  const navItems = [
    { label: 'Register', href: '/dashboard/pos', icon: ShoppingBag },
    { label: 'Inventory', href: '/dashboard/products', icon: Package },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-[#EBF0F6] overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r transition-all duration-300 flex flex-col z-50",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className={cn("flex items-center gap-3", !isSidebarOpen && "hidden")}>
            <div className="bg-primary p-2 rounded-lg">
              <ShoppingBag className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-primary">NovaPOS</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-muted-foreground"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-primary"
                )}>
                  <Icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                  {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <div className={cn("flex items-center gap-3 px-4 py-2", !isSidebarOpen && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold uppercase">
              {currentUser.charAt(0)}
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold truncate max-w-[120px]">{currentUser}</span>
                <span className="text-xs text-muted-foreground">Cashier</span>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className={cn("w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive", !isSidebarOpen && "justify-center px-0")}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
